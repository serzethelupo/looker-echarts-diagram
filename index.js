/* global dscc, document, window */
(function () {
  const order = ['Mo', 'Tu', 'Wd', 'Th', 'Fr', 'Sa', 'Su'];
  const daySet = new Set(order);

  function ensureRoot() {
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      root.style.width = '100%';
      root.style.height = '100%';
      root.style.boxSizing = 'border-box';
      document.body.style.margin = '0';
      document.body.appendChild(root);
    }
    return root;
  }

  function parseRow(row) {
    const d0 = String(row.dimensions[0] ?? '');
    const d1 = String(row.dimensions[1] ?? '');
    const isDay0 = daySet.has(d0);
    const isDay1 = daySet.has(d1);
    const wk = isDay0 ? d0 : (isDay1 ? d1 : d0);

    // Час может быть "14" или "14:00:00"
    const hStr = isDay0 ? d1 : (isDay1 ? d0 : d1);
    const hr = Number(String(hStr).split(':')[0]);

    const cnt = Number(row.metrics[0]);
    return { wk, hr, cnt };
  }

  function buildSeries(rows) {
    const map = new Map(order.map(d => [d, new Array(24).fill(0)]));
    rows.forEach(r => {
      const { wk, hr, cnt } = parseRow(r);
      if (!daySet.has(wk)) return;
      if (!Number.isFinite(hr) || hr < 0 || hr > 23) return;
      if (!Number.isFinite(cnt)) return;
      map.get(wk)[hr] += cnt;
    });
    return map;
  }

  function globalMaxFromMap(seriesMap) {
    const all = Array.from(seriesMap.values()).flat();
    const max = Math.max(1, ...all); // защита от 0
    return max;
  }

  function gradient(c1, c2) {
    return {
      opacity: 0.85,
      color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: c1 },
        { offset: 1, color: c2 }
      ])
    };
  }

  function draw(data) {
    const root = ensureRoot();
    const table = (data.tables && data.tables.DEFAULT) ? data.tables.DEFAULT : [];
    if (!table.length) {
      root.innerHTML = '<div style="padding:12px;color:#888;font:12px/1.4 system-ui, sans-serif">No data</div>';
      return;
    }

    const showLegend = data.style && data.style.showLegend ? !!data.style.showLegend.value : false;
    const stackSeries = data.style && data.style.stackSeries ? !!data.style.stackSeries.value : true;

    const seriesMap = buildSeries(table);
    const yMax = globalMaxFromMap(seriesMap);
    const xCats = Array.from({ length: 24 }, (_, i) => i);

    const gradients = [
      ['rgb(128,255,165)', 'rgb(1,191,236)'],
      ['rgb(0,221,255)',   'rgb(77,119,255)'],
      ['rgb(55,162,255)',  'rgb(116,21,219)'],
      ['rgb(255,0,135)',   'rgb(135,0,157)'],
      ['rgb(255,191,0)',   'rgb(224,62,76)'],
      ['rgb(122,87,209)',  'rgb(86,40,180)'],
      ['rgb(255,159,127)', 'rgb(255,99,71)']
    ];

    const series = order.map((day, i) => ({
      name: day,
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 0 },
      showSymbol: false,
      areaStyle: gradient(gradients[i][0], gradients[i][1]),
      emphasis: { focus: 'series' },
      stack: stackSeries ? 'total' : undefined,
      data: seriesMap.get(day)
    }));

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
        valueFormatter: v => (Number.isFinite(v) ? String(v) : v)
      },
      legend: { show: showLegend, data: order },
      grid: { left: 32, right: 12, top: 8, bottom: 28, containLabel: true },
      xAxis: [{ type: 'category', boundaryGap: false, data: xCats }],
      yAxis: [{ type: 'value', min: 0, max: yMax }],
      series
    };

    const chart = window.echarts.getInstanceByDom(root) || window.echarts.init(root);
    chart.setOption(option, true);
    chart.resize();
  }

  // Подписка Looker Studio
  dscc.subscribeToData(draw, { transform: dscc.arrayTransform });
  window.addEventListener('resize', () => {
    const root = document.getElementById('root');
    const inst = root ? window.echarts.getInstanceByDom(root) : null;
    if (inst) inst.resize();
  });
})();
