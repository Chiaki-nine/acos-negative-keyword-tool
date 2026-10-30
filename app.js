(function () {
  'use strict';

  const fileInput = document.getElementById('reportFile');
  const fileName = document.getElementById('fileName');
  const dropzone = document.getElementById('dropzone');
  const form = document.getElementById('uploadForm');
  const analyzeButton = document.getElementById('analyzeButton');
  const resetButton = document.getElementById('resetButton');
  const downloadButton = document.getElementById('downloadButton');
  const statusBox = document.getElementById('status');
  const results = document.getElementById('results');
  const metricGrid = document.getElementById('metricGrid');
  const resultTitle = document.getElementById('resultTitle');
  const productTitles = document.getElementById('productTitles');
  const productSt = document.getElementById('productSt');
  const productContextPanel = document.getElementById('productContextPanel');
  let currentAnalysis = null;

  function setStatus(message, kind = '') {
    statusBox.className = `status${kind ? ` ${kind}` : ''}`;
    statusBox.textContent = message;
  }

  function nextPaint() {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  }

  function money(value) {
    return `€${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function integer(value) {
    return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function pct(value) {
    return value === null || value === undefined ? 'n.a.' : `${(Number(value) * 100).toFixed(1)}%`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    })[character]);
  }

  function showSelectedFile(file) {
    if (!file) {
      fileName.textContent = '尚未选择文件';
      return;
    }
    const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    fileName.textContent = `${file.name} · ${size}`;
  }

  fileInput.addEventListener('change', () => showSelectedFile(fileInput.files[0]));

  ['dragenter', 'dragover'].forEach(name => dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(name => dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.remove('dragover');
  }));
  dropzone.addEventListener('drop', event => {
    const file = event.dataTransfer.files[0];
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    showSelectedFile(file);
  });

  function renderMetrics(overall) {
    const cards = [
      ['明细行数', integer(overall.detail_rows)],
      ['唯一搜索词', integer(overall.unique_search_terms)],
      ['广告花费', money(overall.spend)],
      ['广告销售额', money(overall.sales)],
      ['广告订单', integer(overall.orders)],
      ['整体 ACOS', pct(overall.acos)],
      ['产品重点词', integer(overall.focus_root_count)],
      ['暂缓否定', integer(overall.protected_recommendation_count)],
    ];
    metricGrid.innerHTML = cards.map(([label, value]) => `
      <div class="metric"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value">${escapeHtml(value)}</div></div>
    `).join('');
  }

  function renderProductContext(context, overall) {
    if (!context?.provided) {
      productContextPanel.innerHTML = '<div><strong>未提供产品标题/ST</strong><p>本次按基础规则分析，未启用产品重点词保护。下次填写标题或 ST，可减少误否相关词。</p></div>';
      productContextPanel.classList.add('context-empty');
      return;
    }
    productContextPanel.classList.remove('context-empty');
    const roots = context.focus_roots || [];
    const chips = roots.length
      ? roots.slice(0, 40).map(word => `<span class="root-chip">${escapeHtml(word)}</span>`).join('')
      : '<span class="table-caption">没有识别到重复或核心重点词，产品相关词仍会参与复核。</span>';
    productContextPanel.innerHTML = `
      <div class="context-title"><strong>已启用产品语义保护</strong><span>${integer(context.titles?.length)} 个标题 · ${integer(context.search_terms?.length)} 组 ST · 常规无转化观察量约 ${integer(overall.expected_clicks_per_order)} 次点击</span></div>
      <div class="chip-list">${chips}</div>`;
  }

  function renderTable(id, rows) {
    const table = document.getElementById(id);
    if (!rows.length) {
      table.innerHTML = '<tbody><tr><td class="empty">暂无符合条件的建议</td></tr></tbody>';
      return;
    }
    const headers = ['词根/搜索词', '层级', '花费', '广告销售额', '订单', '点击', 'ACOS', '优先级 / 状态', '对应关键词 / 关键词状态', '相关性 / 季节 / 数据', '原因'];
    const head = `<thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>`;
    const body = rows.map(row => {
      const acosClass = row.ACOS_value === null || row.ACOS_value === undefined ? '' : (row.ACOS_value >= 0.5 ? 'acos-high' : (row.ACOS_value >= 0.3 ? 'acos-mid' : 'acos-good'));
      return `<tr>
        <td><strong>${escapeHtml(row['否词词根/词组'])}</strong><br><span class="table-caption">${escapeHtml(row['建议类型'])}</span></td>
        <td>${escapeHtml(row['层级'])}</td>
        <td class="number">${money(row['花费'])}</td>
        <td class="number">${money(row['广告销售额'])}</td>
        <td class="number">${integer(row['广告订单'])}</td>
        <td class="number">${integer(row['点击'])}</td>
        <td class="number ${acosClass}">${pct(row.ACOS_value)}</td>
        <td>${escapeHtml(row['优先级'])}<br><span class="table-caption">${escapeHtml(row['状态'])}</span></td>
        <td>${escapeHtml(row['对应关键词'])}<br><span class="table-caption">关键词：${escapeHtml(row['关键词状态']) || '未标记'}<br>搜索词：${escapeHtml(row['用户搜索词否定状态']) || '未标记'}</span></td>
        <td>${escapeHtml(row['产品相关性'])}<br><span class="table-caption">${escapeHtml(row['季节性判断'])} · ${escapeHtml(row['数据成熟度'])}</span></td>
        <td>${escapeHtml(row['原因'])}</td>
      </tr>`;
    }).join('');
    table.innerHTML = head + `<tbody>${body}</tbody>`;
  }

  function renderAnalysis(data) {
    resultTitle.textContent = `${data.source_filename} 的否词建议`;
    renderMetrics(data.overall);
    renderProductContext(data.product_context, data.overall);
    renderTable('phraseTable', data.phrase_recs || []);
    renderTable('exactTable', data.exact_recs || []);
    renderTable('protectedTable', data.protected_recs || []);
    document.getElementById('phraseCaption').textContent = `${data.phrase_recs.length} 条 · 按词根处理`;
    document.getElementById('exactCaption').textContent = `${data.exact_recs.length} 条 · 按用户搜索词处理`;
    document.getElementById('protectedCaption').textContent = `${data.protected_recs.length} 条 · 暂不直接否定`;
    results.hidden = false;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      setStatus('请先选择搜索词报告。', 'error');
      return;
    }
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setStatus('请上传 .xlsx 或 .xls 格式的 Excel 文件。', 'error');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setStatus('文件超过 100 MB，浏览器可能无法稳定处理。请先精简报告后重试。', 'error');
      return;
    }

    analyzeButton.disabled = true;
    resetButton.disabled = true;
    downloadButton.disabled = true;
    currentAnalysis = null;
    results.hidden = true;
    try {
      setStatus('正在读取 Excel，文件只在当前浏览器中处理…');
      await nextPaint();
      const buffer = await file.arrayBuffer();
      setStatus('正在拆分词根、计算 ACOS 并判断保护条件…');
      await nextPaint();
      const analysis = window.AcosAnalysis.analyzeWorkbook(buffer, {
        sourceFilename: file.name,
        productTitles: productTitles.value.trim(),
        productSt: productSt.value.trim(),
      });
      currentAnalysis = analysis;
      renderAnalysis(analysis);
      downloadButton.disabled = false;
      setStatus('分析完成。结果仅保存在当前页面内存中，可直接导出否词建议表。', 'success');
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error(error);
      setStatus(error?.message || '分析失败，请检查文件格式和字段后重试。', 'error');
    } finally {
      analyzeButton.disabled = false;
      resetButton.disabled = false;
    }
  });

  downloadButton.addEventListener('click', async () => {
    if (!currentAnalysis) return;
    downloadButton.disabled = true;
    setStatus('正在生成 Excel 否词建议表…');
    await nextPaint();
    try {
      window.AcosExport.downloadWorkbook(currentAnalysis);
      setStatus('否词建议表已生成，浏览器将开始下载。', 'success');
    } catch (error) {
      console.error(error);
      setStatus(error?.message || '导出失败，请刷新页面后重试。', 'error');
    } finally {
      downloadButton.disabled = false;
    }
  });

  resetButton.addEventListener('click', () => {
    form.reset();
    currentAnalysis = null;
    showSelectedFile(null);
    results.hidden = true;
    downloadButton.disabled = true;
    setStatus('已清空。');
  });

  downloadButton.disabled = true;
}());
