document.addEventListener('DOMContentLoaded', () => {
  const monitor = document.querySelector('[data-alert-monitor]');
  if (!monitor) return;

  const list = monitor.querySelector('[data-alert-list]');
  const count = monitor.querySelector('[data-alert-count]');
  const status = monitor.querySelector('[data-alert-status]');
  const updated = monitor.querySelector('[data-alert-updated]');
  const apiBase = 'https://api.ps2alerts.com';
  const historyUrl = 'https://ps2alerts.com/alert-history';
  const refreshInterval = 15000;
  const populationInterval = 30000;
  const historyInterval = 300000;
  const populationCache = new Map();
  let lastAlertCache = { data: null, fetchedAt: 0 };
  let refreshTimer = 0;
  let isRefreshing = false;

  const ospreyWorldIds = new Set([1, 17]);

  const zones = {
    2: 'Indar',
    4: 'Hossin',
    6: 'Amerish',
    8: 'Esamir',
    344: 'Oshur'
  };

  const factions = [
    { key: 'vs', label: 'VS' },
    { key: 'tr', label: 'TR' },
    { key: 'nc', label: 'NC' },
    { key: 'other', label: '—' }
  ];

  const setStatus = (label, error = false) => {
    status.lastChild.textContent = ` ${label}`;
    status.classList.toggle('is-error', error);
  };

  const fetchJson = async path => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${apiBase}${path}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`PS2Alerts respondeu com ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const makeMessage = (text, includeLink = false) => {
    const message = document.createElement('p');
    message.className = 'alert-monitor-message';
    message.append(text);

    if (includeLink) {
      message.append(' ');
      const link = document.createElement('a');
      link.href = historyUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Abrir histórico ↗';
      message.append(link);
    }

    return message;
  };

  const isOspreyAlert = alert => {
    const worldName = String(alert.worldName || alert.world || '').trim();
    return ospreyWorldIds.has(Number(alert.world)) || /^(osprey|connery|emerald)$/i.test(worldName);
  };

  const createClosedAlert = lastAlert => {
    const closed = document.createElement('div');
    const server = document.createElement('p');
    const mapSource = document.createElement('small');
    const ruleTop = document.createElement('span');
    const message = document.createElement('strong');
    const ruleBottom = document.createElement('span');
    const link = document.createElement('a');

    closed.className = 'alert-closed';
    server.className = 'alert-closed-server';
    server.textContent = lastAlert
      ? `Osprey · ${zones[lastAlert.zone] || `Continente ${lastAlert.zone}`}`
      : 'Osprey · Último mapa indisponível';
    mapSource.className = 'alert-closed-map-source';
    mapSource.textContent = 'Último mapa iniciado registrado pelo PS2Alerts';
    ruleTop.className = 'alert-closed-rule alert-closed-rule-top';
    ruleBottom.className = 'alert-closed-rule alert-closed-rule-bottom';
    ruleTop.setAttribute('aria-hidden', 'true');
    ruleBottom.setAttribute('aria-hidden', 'true');
    message.textContent = 'SEM ALERTA ATIVO';
    link.href = historyUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Consultar histórico ↗';

    closed.append(server, mapSource, ruleTop, message, ruleBottom, link);
    return closed;
  };

  const getLastOspreyAlert = async () => {
    if (Date.now() - lastAlertCache.fetchedAt < historyInterval) return lastAlertCache.data;

    const histories = await Promise.allSettled([...ospreyWorldIds].map(world => (
      fetchJson(`/instances/territory-control?world=${world}&sortBy=timeStarted&order=desc&pageSize=1`)
    )));
    const records = histories.flatMap(result => (
      result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []
    ));
    const latest = records
      .filter(isOspreyAlert)
      .sort((first, second) => new Date(second.timeStarted) - new Date(first.timeStarted))[0] || null;

    lastAlertCache = { data: latest, fetchedAt: Date.now() };
    return latest;
  };

  const percentageSet = values => {
    const safeValues = values.map(value => Math.max(0, Number(value) || 0));
    const total = safeValues.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return safeValues.map(() => 0);
    return safeValues.map(value => (value / total) * 100);
  };

  const createBar = (values, accessibleLabel) => {
    const bar = document.createElement('div');
    const percentages = percentageSet(factions.map(faction => values[faction.key]));
    bar.className = 'faction-bar';
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${accessibleLabel}: ${factions.map((faction, index) => `${faction.label} ${Math.round(percentages[index])}%`).join(', ')}`);

    factions.forEach((faction, index) => {
      const value = percentages[index];
      if (value <= 0) return;

      const segment = document.createElement('span');
      segment.className = 'faction-segment';
      segment.dataset.faction = faction.key;
      segment.style.width = `${value.toFixed(2)}%`;
      segment.textContent = value >= 9 ? `${Math.round(value)}%` : '';
      segment.title = `${faction.label}: ${Math.round(value)}%`;
      bar.append(segment);
    });

    return bar;
  };

  const createBarRow = (label, values) => {
    const row = document.createElement('div');
    const rowLabel = document.createElement('span');
    row.className = 'alert-bar-row';
    rowLabel.className = 'alert-bar-label';
    rowLabel.textContent = label;
    row.append(rowLabel, createBar(values, label));
    return row;
  };

  const getPopulation = async instanceId => {
    const cached = populationCache.get(instanceId);
    if (cached && Date.now() - cached.fetchedAt < populationInterval) return cached.data;

    const records = await fetchJson(`/aggregates/instance/${encodeURIComponent(instanceId)}/population?sortBy=timestamp&order=desc&pageSize=1`);
    const data = Array.isArray(records) ? records[0] : null;
    populationCache.set(instanceId, { data, fetchedAt: Date.now() });
    return data;
  };

  const createAlertEntry = (alert, population) => {
    const entry = document.createElement('article');
    const heading = document.createElement('div');
    const server = document.createElement('span');
    const timer = document.createElement('time');
    const bars = document.createElement('div');
    const territory = alert.result || {};
    const endTime = new Date(alert.timeStarted).getTime() + (Number(alert.duration) || 0);

    entry.className = 'alert-entry';
    heading.className = 'alert-entry-head';
    server.className = 'alert-entry-server';
    server.textContent = `Osprey · ${zones[alert.zone] || `Continente ${alert.zone}`}`;
    timer.className = 'alert-entry-timer';
    timer.dataset.alertEnd = String(endTime);
    timer.setAttribute('aria-label', 'Tempo restante');
    bars.className = 'alert-entry-bars';

    heading.append(server, timer);
    bars.append(createBarRow('Território', {
      vs: territory.vs,
      tr: territory.tr,
      nc: territory.nc,
      other: (Number(territory.cutoff) || 0) + (Number(territory.outOfPlay) || 0)
    }));

    if (population) {
      bars.append(createBarRow('População', {
        vs: population.vs,
        tr: population.tr,
        nc: population.nc,
        other: population.nso
      }));
    }

    entry.append(heading, bars);
    return entry;
  };

  const updateCountdowns = () => {
    monitor.querySelectorAll('[data-alert-end]').forEach(timer => {
      const remaining = Math.max(0, Number(timer.dataset.alertEnd) - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      timer.textContent = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
    });
  };

  const renderAlerts = async alerts => {
    const activeAlerts = alerts.filter(alert => alert && alert.instanceId && isOspreyAlert(alert)).slice(0, 5);
    list.replaceChildren();
    count.textContent = String(activeAlerts.length).padStart(2, '0');

    if (!activeAlerts.length) {
      const lastAlert = await getLastOspreyAlert();
      list.append(createClosedAlert(lastAlert));
      setStatus('Monitorando Osprey');
      return;
    }

    setStatus('Osprey ao vivo');
    const populations = await Promise.allSettled(activeAlerts.map(alert => getPopulation(alert.instanceId)));
    activeAlerts.forEach((alert, index) => {
      const population = populations[index].status === 'fulfilled' ? populations[index].value : null;
      list.append(createAlertEntry(alert, population));
    });
    updateCountdowns();
  };

  const refresh = async () => {
    if (isRefreshing || document.hidden) return;
    isRefreshing = true;

    try {
      const alerts = await fetchJson('/instances/active?sortBy=timeStarted');
      if (!Array.isArray(alerts)) throw new Error('Formato de resposta inesperado');
      await renderAlerts(alerts);
      updated.textContent = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date());
    } catch (error) {
      list.replaceChildren(makeMessage('Não foi possível consultar os alertas agora.', true));
      count.textContent = '--';
      setStatus('Conexão instável', true);
    } finally {
      isRefreshing = false;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(refresh, refreshInterval);
    }
  };

  window.setInterval(updateCountdowns, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refresh();
  });
  refresh();
});
