(function (root) {
  'use strict';

  const navy = '17365D';
  const blue = '1F4E78';
  const lightBlue = 'D9EAF7';
  const paleBlue = 'EFF6FC';
  const paleRed = 'FDE2E1';
  const paleAmber = 'FFF2CC';
  const paleGreen = 'E2F0D9';
  const darkText = '222222';
  const line = 'D9E2F3';

  const styles = {
    title: {
      font: { name: 'Arial', sz: 16, bold: true, color: { rgb: navy } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center' },
    },
    subtitle: {
      font: { name: 'Arial', sz: 10, italic: true, color: { rgb: '666666' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', wrapText: true },
    },
    note: {
      font: { name: 'Arial', sz: 10, color: { rgb: '555555' } },
      fill: { patternType: 'solid', fgColor: { rgb: paleBlue } },
      alignment: { vertical: 'center', wrapText: true },
    },
    section: {
      font: { name: 'Arial', sz: 11, bold: true, color: { rgb: navy } },
      fill: { patternType: 'solid', fgColor: { rgb: lightBlue } },
      alignment: { vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'B4C7E7' } },
        bottom: { style: 'thin', color: { rgb: 'B4C7E7' } },
      },
    },
    header: {
      font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: blue } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        left: { style: 'thin', color: { rgb: 'FFFFFF' } },
        right: { style: 'thin', color: { rgb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
      },
    },
    body: {
      font: { name: 'Arial', sz: 10, color: { rgb: darkText } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: line } } },
    },
  };

  function cloneStyle(style) {
    return JSON.parse(JSON.stringify(style));
  }

  function cellAddress(rowIndex, columnIndex) {
    return root.XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  }

  function ensureCell(sheet, rowIndex, columnIndex) {
    const address = cellAddress(rowIndex, columnIndex);
    if (!sheet[address]) sheet[address] = { t: 's', v: '' };
    return sheet[address];
  }

  function applyStyle(sheet, startRow, endRow, startColumn, endColumn, style) {
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      for (let columnIndex = startColumn; columnIndex <= endColumn; columnIndex += 1) {
        ensureCell(sheet, rowIndex, columnIndex).s = cloneStyle(style);
      }
    }
  }

  function formatCell(sheet, rowIndex, columnIndex, header, value) {
    const cell = ensureCell(sheet, rowIndex, columnIndex);
    cell.s = cloneStyle(styles.body);
    if (['花费', '广告销售额', '广告花费'].includes(header)) {
      cell.z = '€#,##0.00';
      cell.s.alignment.horizontal = 'right';
    } else if (header === 'ACOS' || header === 'ACOS_value' || header === 'CVR' || header === 'CVR_value') {
      cell.z = '0.0%';
      cell.s.alignment.horizontal = 'right';
      if (value !== null && value !== undefined && typeof value === 'number') {
        const fill = value >= 0.5 ? paleRed : (value >= 0.3 ? paleAmber : paleGreen);
        cell.s.fill = { patternType: 'solid', fgColor: { rgb: fill } };
        if (value >= 0.5) cell.s.font = { ...cell.s.font, bold: true, color: { rgb: '9C0006' } };
      }
    } else if (['曝光量', '点击', '广告订单', '广告销量', '报表行数', '搜索词数', '已否定搜索词数', '标题出现次数', 'ST出现次数', '总出现次数'].includes(header)) {
      cell.z = '#,##0';
      cell.s.alignment.horizontal = 'right';
    } else if (typeof value === 'number') {
      cell.z = '#,##0.00';
      cell.s.alignment.horizontal = 'right';
    } else {
      cell.s.alignment.wrapText = ['原因', '建议原因', '保护依据', '保护状态', '季节性判断', '产品相关性', '对应关键词', '关键词状态', '用户搜索词否定状态', '产品标题', '产品 ST', '保护方式', '重点依据', '词根拆分'].includes(header);
    }
  }

  function columnWidths(headers, records, overrides = {}) {
    return headers.map((header, columnIndex) => {
      if (overrides[header]) return { wch: overrides[header] };
      let width = Math.max(10, String(header ?? '').length * 2 + 2);
      const sample = records.slice(0, 120);
      sample.forEach(row => {
        const value = row[columnIndex];
        if (value === null || value === undefined) return;
        width = Math.max(width, Math.min(42, String(value).length + 2));
      });
      return { wch: Math.min(42, width) };
    });
  }

  function createTableSheet(title, note, headers, records, options = {}) {
    const displayHeaders = headers.map(header => options.headerLabels?.[header] || header);
    const matrix = [
      [title],
      [note],
      [],
      displayHeaders,
      ...records,
    ];
    const sheet = root.XLSX.utils.aoa_to_sheet(matrix);
    const lastColumn = Math.max(0, headers.length - 1);
    const lastRow = Math.max(4, records.length + 3);
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } },
    ];
    applyStyle(sheet, 0, 0, 0, lastColumn, styles.title);
    applyStyle(sheet, 1, 1, 0, lastColumn, styles.note);
    applyStyle(sheet, 3, 3, 0, lastColumn, styles.header);
    records.forEach((row, rowOffset) => row.forEach((value, columnIndex) => {
      formatCell(sheet, rowOffset + 4, columnIndex, headers[columnIndex], value);
    }));
    sheet['!cols'] = columnWidths(headers, records, options.widths || {});
    sheet['!rows'] = [{ hpt: 24 }, { hpt: 34 }, { hpt: 8 }, { hpt: 28 }];
    sheet['!autofilter'] = { ref: root.XLSX.utils.encode_range({ s: { r: 3, c: 0 }, e: { r: lastRow, c: lastColumn } }) };
    sheet['!freeze'] = { xSplit: options.freezeColumns || 0, ySplit: 4, topLeftCell: cellAddress(4, options.freezeColumns || 0), activePane: 'bottomRight', state: 'frozen' };
    return sheet;
  }

  function recommendationRows(items, headers) {
    return items.map(item => headers.map(header => item[header] ?? null));
  }

  function addDecisionSection(matrix, title, items, limit = Infinity) {
    matrix.push([], [title]);
    const headers = ['建议类型', '优先级', '词根/搜索词', '层级', '花费', '广告销售额', '广告订单', '点击', 'ACOS', '相关性 / 季节 / 数据', '原因'];
    matrix.push(headers);
    const rows = items.slice(0, limit).map(item => [
      item['建议类型'], item['优先级'], item['否词词根/词组'], item['层级'], item['花费'], item['广告销售额'],
      item['广告订单'], item['点击'], item['ACOS_value'],
      [item['产品相关性'], item['季节性判断'], item['数据成熟度']].filter(Boolean).join(' / '), item['原因'],
    ]);
    matrix.push(...(rows.length ? rows : [['暂无符合条件的记录']]));
  }

  function createSummarySheet(data) {
    const matrix = [
      ['亚马逊广告搜索词分析与否词建议'],
      [`来源：${data.source_filename}；报告期间：${data.report_period}；分析日期：${data.analysis_date}`],
      ['口径：ACOS = 广告花费 / 广告销售额。标题/ST 重点词不自动做词组否定；季节未到、天气驱动或数据不足时暂缓否定。广告销售额为 0 时 ACOS 显示 n.a.。'],
      [],
      ['整体表现'],
      ['指标', '值', '说明'],
      ['明细行数', data.overall.detail_rows, '不含总计行'],
      ['唯一搜索词', data.overall.unique_search_terms, '按标准化搜索词汇总'],
      ['曝光量', data.overall.impressions, '报告明细合计'],
      ['点击', data.overall.clicks, '报告明细合计'],
      ['广告花费', data.overall.spend, 'EUR'],
      ['广告销售额', data.overall.sales, 'EUR'],
      ['广告订单', data.overall.orders, '报告明细合计'],
      ['整体 ACOS', data.overall.acos, '广告花费 / 广告销售额'],
      ['产品重点词', data.overall.focus_root_count, '来自标题与 ST'],
      ['暂缓否定', data.overall.protected_recommendation_count, '产品、季节/天气或数据保护'],
      [],
      ['重点词', data.product_context.focus_roots.join('、') || (data.product_context.provided ? '未识别到重点词' : '未提供产品标题/ST')],
    ];
    addDecisionSection(matrix, '词组否定候选', data.phrase_recs, 30);
    addDecisionSection(matrix, '精准否定候选', data.exact_recs, 50);
    addDecisionSection(matrix, '暂缓否定与观察', data.protected_recs, 50);
    const sheet = root.XLSX.utils.aoa_to_sheet(matrix);
    const lastRow = matrix.length - 1;
    applyStyle(sheet, 0, lastRow, 0, 10, styles.body);
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
    ];
    applyStyle(sheet, 0, 0, 0, 10, styles.title);
    applyStyle(sheet, 1, 1, 0, 10, styles.subtitle);
    applyStyle(sheet, 2, 2, 0, 10, styles.note);
    for (let rowIndex = 4; rowIndex <= lastRow; rowIndex += 1) {
      const first = matrix[rowIndex]?.[0];
      if (['整体表现', '词组否定候选', '精准否定候选', '暂缓否定与观察'].includes(first)) {
        applyStyle(sheet, rowIndex, rowIndex, 0, 10, styles.section);
      } else if (first === '指标' || first === '建议类型') {
        applyStyle(sheet, rowIndex, rowIndex, 0, 10, styles.header);
      } else if (matrix[rowIndex]?.length) {
        matrix[rowIndex].forEach((value, columnIndex) => {
          let header = '';
          if (rowIndex >= 6 && rowIndex <= 15) header = matrix[rowIndex][0];
          else if (columnIndex === 4 || columnIndex === 5) header = columnIndex === 4 ? '花费' : '广告销售额';
          else if (columnIndex === 8) header = 'ACOS';
          formatCell(sheet, rowIndex, columnIndex, header, value);
        });
      }
    }
    const overallAcosCell = sheet[cellAddress(13, 1)];
    if (overallAcosCell && data.overall.acos !== null) overallAcosCell.z = '0.0%';
    [10, 11].forEach(rowIndex => { if (sheet[cellAddress(rowIndex, 1)]) sheet[cellAddress(rowIndex, 1)].z = '€#,##0.00'; });
    sheet['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 34 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 38 }, { wch: 60 },
    ];
    sheet['!rows'] = [{ hpt: 26 }, { hpt: 20 }, { hpt: 36 }];
    sheet['!freeze'] = { xSplit: 0, ySplit: 3, topLeftCell: 'A4', activePane: 'bottomLeft', state: 'frozen' };
    return sheet;
  }

  function createWorkbook(data) {
    if (!root.XLSX) throw new Error('Excel 处理组件未加载，请刷新页面后重试');
    const workbook = root.XLSX.utils.book_new();
    workbook.Props = {
      Title: '亚马逊搜索词否词建议',
      Subject: 'ACOS、词根、标题/ST、季节性与否词建议',
      Author: 'ACOS Negative Keyword Tool',
      CreatedDate: new Date(`${data.analysis_date}T00:00:00`),
    };
    workbook.Workbook = { Views: [{ RTL: false }] };
    root.XLSX.utils.book_append_sheet(workbook, createSummarySheet(data), '分析总览');

    const productRecords = data.product_records.length
      ? data.product_records.map(row => row.map((value, index) => index === 5 ? (value ? '是' : '否') : value))
      : [['未提供标题/ST', 0, 0, 0, '', '否', '未启用产品词识别', '非明显季节词', '填写标题或 ST 后启用产品词保护']];
    root.XLSX.utils.book_append_sheet(workbook, createTableSheet(
      '产品标题、ST 与重点词',
      `已提供 ${data.product_context.titles.length} 个标题、${data.product_context.search_terms.length} 组 ST。重点词不自动做词组否定。`,
      data.product_headers,
      productRecords,
      { widths: { '词根': 22, '重点依据': 28, '季节属性': 20, '保护方式': 48 } },
    ), '产品词库');

    root.XLSX.utils.book_append_sheet(workbook, createTableSheet(
      '词根 ACOS、相关性与保护状态',
      '词根金额不能纵向相加回整体花费，因为同一搜索词的金额会计入它包含的每个词根。',
      data.root_headers,
      data.root_records,
      {
        headerLabels: { ACOS_value: 'ACOS', CVR_value: 'CVR' }, freezeColumns: 1,
        widths: { '词根': 22, '风险状态': 18, '产品相关性': 20, '季节属性': 20, '季节性判断': 24, '数据成熟度': 18, '保护状态': 34 },
      },
    ), '词根分析');

    root.XLSX.utils.book_append_sheet(workbook, createTableSheet(
      '搜索词明细、产品相关性与建议',
      '搜索词已按标准化文本汇总。“关键词是否否定”对应投放关键词，“用户搜索词是否否定”对应搜索词本身。',
      data.term_headers,
      data.term_records,
      {
        headerLabels: { ACOS_value: 'ACOS', CVR_value: 'CVR' }, freezeColumns: 1,
        widths: { '搜索词': 34, '中文翻译': 18, '词根拆分': 32, '产品相关性': 24, '季节性判断': 24, '保护状态': 28, '建议': 28, '建议原因': 58, '关键词': 32, '用户搜索词否定状态': 24, '关键词否定状态': 24 },
      },
    ), '搜索词分析');

    root.XLSX.utils.book_append_sheet(workbook, createTableSheet(
      '否词建议与暂缓否定清单',
      `词组候选 ${data.phrase_recs.length} 条；精准候选 ${data.exact_recs.length} 条；暂缓否定 ${data.protected_recs.length} 条。`,
      data.recommendation_headers,
      data.recommendation_records,
      {
        headerLabels: { '否词词根/词组': '词根/搜索词', ACOS_value: 'ACOS' }, freezeColumns: 3,
        widths: { '建议类型': 34, '优先级': 14, '否词词根/词组': 36, '对应关键词': 32, '关键词状态': 22, '用户搜索词否定状态': 24, '产品相关性': 24, '季节性判断': 24, '数据成熟度': 18, '保护依据': 42, '原因': 62, '状态': 14 },
      },
    ), '否词建议');

    root.XLSX.utils.book_append_sheet(workbook, createTableSheet(
      '原始数据',
      `来源：${data.source_filename}。原始数据按上传内容保留，分析不会修改源文件。`,
      data.raw_headers,
      data.raw_records,
      { widths: {} },
    ), '原始数据');
    return workbook;
  }

  function workbookBlob(data) {
    const workbook = createWorkbook(data);
    const bytes = root.XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true, cellStyles: true });
    return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function downloadWorkbook(data, filename = '') {
    const blob = workbookBlob(data);
    const safeDate = data.analysis_date || new Date().toISOString().slice(0, 10);
    const name = filename || `否词建议表_${safeDate}.xlsx`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  root.AcosExport = { createWorkbook, downloadWorkbook, workbookBlob };
}(typeof window !== 'undefined' ? window : globalThis));
