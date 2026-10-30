(function (root) {
  'use strict';

  const stopwords = new Set([
    'für', 'fur', 'aus', 'mit', 'und', 'and', 'for', 'the', 'der', 'die', 'den', 'des', 'ein', 'eine',
    'einer', 'einen', 'im', 'in', 'an', 'von', 'zu', 'auf', 'ohne', 'vielen', 'viele', 'einem', 'eines',
    'als', 'sowie', 'of', 'to', 'a', 'oder', 'or', 'bei', 'bis', 'zum', 'zur',
  ]);

  const coreRoots = new Set([
    'herren', 'herr', 'jacke', 'jacken', 'jacket', 'jack', 'bomberjacke', 'bomber', 'sommerjacke', 'sommer',
    'blouson', 'leicht', 'frühling', 'fruehling', 'frühlingsjacke', 'frühlingsjacken', 'herrenjacke',
    'herrenjacken', 'übergangsjacke', 'übergangsjacken', 'übergang', 'mann', 'männer', 'men', 'pilotenjacke',
    'bluson', 'freizeitjacke', 'sportjacke',
  ]);

  const attributeRoots = new Set([
    'schwarz', 'schwarze', 'schwarzen', 'weiss', 'weiße', 'weisse', 'weiß', 'blau', 'blaue', 'blauen', 'grau',
    'graue', 'grün', 'grüne', 'rot', 'rote', 'weinrot', 'braun', 'dunkelblau', 'hellblau', 'xl', 'xxl', 'xxxl',
    '3xl', 's', 'm', 'l', 'kurz', 'dünn', 'dunne', 'dünne', 'leicht', 'leichte', 'leichter', 'wasserdicht',
    'atmungsaktiv', 'stehkragen', 'kragen', 'reissverschluss', 'innen', 'innentaschen', 'modern', 'elegant',
    'sportlich', 'coole', 'cool', 'winter', 'herbst', 'frühjahr', 'fruehjahr', 'frühlings', 'summer', 'warm',
    'gefüttert', 'gefuettert', 'regen', 'wind', 'windbreaker',
  ]);

  const brandOrPurposeRoots = new Set([
    'boss', 'north', 'face', 'calvin', 'hilfiger', 'wolfskin', 'jones', 'tom', 'kevin', 'klein', 'army',
    'militär', 'militaer', 'security', 'adidas', 'nike', 'puma', 'columbia', 'napapijri', 'carhartt',
  ]);

  const genericProductRoots = new Set(['herren', 'jacke', 'herrenjacke', 'jack', 'jacket']);

  const canonicalAliases = {
    jacken: 'jacke', jacket: 'jacke', jackets: 'jacke',
    herr: 'herren', mann: 'herren', 'männer': 'herren', maenner: 'herren', men: 'herren',
    bomberjacken: 'bomberjacke', sommerjacken: 'sommerjacke',
    'frühlingsjacken': 'frühlingsjacke', fruehlingsjacken: 'frühlingsjacke',
    'übergangsjacken': 'übergangsjacke', uebergangsjacken: 'übergangsjacke',
    leichte: 'leicht', leichter: 'leicht', leichten: 'leicht',
    dunne: 'dünn', 'dünne': 'dünn', 'dünner': 'dünn', 'dünnen': 'dünn',
    warme: 'warm', warmer: 'warm', warmen: 'warm',
    'gefütterte': 'gefüttert', 'gefütterter': 'gefüttert', 'gefütterten': 'gefüttert',
    gefuettert: 'gefüttert', gefuetterte: 'gefüttert', gefuetterter: 'gefüttert',
    wasserdichte: 'wasserdicht', wasserdichter: 'wasserdicht', wasserdichten: 'wasserdicht',
    atmungsaktive: 'atmungsaktiv', atmungsaktiver: 'atmungsaktiv', atmungsaktiven: 'atmungsaktiv',
    schwarze: 'schwarz', schwarzer: 'schwarz', schwarzen: 'schwarz',
    weisse: 'weiss', 'weiße': 'weiss', weisser: 'weiss', 'weißer': 'weiss',
    blaue: 'blau', blauer: 'blau', blauen: 'blau',
    graue: 'grau', grauer: 'grau', grauen: 'grau',
    'grüne': 'grün', gruene: 'grün', 'grüner': 'grün', 'grünen': 'grün',
    rote: 'rot', roter: 'rot', roten: 'rot',
    moderne: 'modern', moderner: 'modern', modernen: 'modern',
    elegante: 'elegant', eleganter: 'elegant', eleganten: 'elegant',
    sportliche: 'sportlich', sportlicher: 'sportlich', sportlichen: 'sportlich',
  };

  const columnSpecs = {
    '关键词': [['关键词', '投放关键词', 'Keyword', 'Targeting'], false],
    '用户搜索词': [['用户搜索词', '搜索词', '客户搜索词', 'Search Term', 'Customer Search Term'], true],
    '曝光量': [['曝光量', '展示量', 'Impressions'], true],
    '点击': [['点击', '点击量', 'Clicks'], true],
    '花费': [['花费', '广告花费', 'Spend'], true],
    '广告订单': [['广告订单', '广告订单数', '7天广告订单数', '7天总广告订单数', 'Orders'], true],
    '广告销售额': [['广告销售额', '7天广告销售额', '7天总广告销售额', '7天总销售额', '销售额', 'Sales'], true],
    '广告销量': [['广告销量', '广告销售量', '7天广告销量', '7天广告销售量', '7天总广告销量', '7天总广告销售量'], false],
    '中文翻译': [['中文翻译', '搜索词中文翻译', '翻译'], false],
    '匹配方式': [['匹配方式', '匹配类型', 'Match Type'], false],
    '用户搜索词是否否定': [['用户搜索词是否否定', '搜索词是否否定', '客户搜索词是否否定', '用户搜索词否定'], false],
    '关键词是否否定': [['关键词是否否定', '关键词否定', '投放是否否定', '关键词是否为否定'], false],
  };

  function cleanText(value) {
    if (value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))) return '';
    return String(value).trim();
  }

  function normalizeHeader(value) {
    return cleanText(value).normalize('NFKC').toLowerCase().replace(/[\s_\-（）()]+/g, '');
  }

  function normSearch(value) {
    return cleanText(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function tokenize(value) {
    const normalized = cleanText(value).normalize('NFKC').toLowerCase().replace(/ß/g, 'ss');
    const parts = normalized.replace(/[^\p{L}\p{N}_]+/gu, ' ').split(/\s+/).filter(Boolean);
    return [...new Set(parts)].sort();
  }

  function canonicalRoot(value) {
    const normalized = cleanText(value).normalize('NFKC').toLowerCase().replace(/ß/g, 'ss');
    return canonicalAliases[normalized] || normalized;
  }

  const canonicalCoreRoots = new Set([...coreRoots].map(canonicalRoot));
  const canonicalAttributeRoots = new Set([...attributeRoots].map(canonicalRoot));
  const canonicalBrandRoots = new Set([...brandOrPurposeRoots].map(canonicalRoot));

  function unique(values) {
    return [...new Set(values)];
  }

  function normalizeEntries(value, separator) {
    const rawValues = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(separator) : []);
    const result = [];
    const seen = new Set();
    rawValues.forEach(item => {
      const text = cleanText(item);
      const key = normSearch(text);
      if (text && !seen.has(key)) {
        result.push(text);
        seen.add(key);
      }
    });
    return result;
  }

  function numeric(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined || cleanText(value) === '') return 0;
    const parsed = Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function roundUp(value) {
    return Math.ceil(value - Number.EPSILON);
  }

  function formatPercent(value) {
    return `${(Number(value) * 100).toFixed(1)}%`;
  }

  function countContextRoots(entries) {
    const counts = new Map();
    entries.forEach(entry => {
      const entryRoots = new Set(
        tokenize(entry)
          .map(canonicalRoot)
          .filter(item => !stopwords.has(item) && item.length > 2 && !/^\d+$/.test(item)),
      );
      entryRoots.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    });
    return counts;
  }

  function rootsAreRelated(left, right) {
    const a = canonicalRoot(left);
    const b = canonicalRoot(right);
    if (a === b) return true;
    return Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a));
  }

  function seasonGroupsForRoots(rootList) {
    const groups = new Set();
    const seasonPatterns = {
      '冬季': ['winter', 'warm', 'gefüttert', 'thermo', 'schnee', 'ski', 'winterjacke'],
      '夏季': ['sommer', 'summer', 'sommerjacke'],
      '春季': ['frühling', 'fruehling', 'frühjahr', 'fruehjahr', 'frühlingsjacke'],
      '秋季/换季': ['herbst', 'übergang', 'uebergang', 'übergangsjacke', 'uebergangsjacke'],
      '天气驱动': ['regen', 'regenjacke', 'wasserdicht', 'wasserfest', 'wind', 'winddicht', 'windbreaker', 'sturm'],
      '气温驱动': ['leicht', 'dünn', 'atmungsaktiv'],
    };
    rootList.forEach(item => {
      const canonical = canonicalRoot(item);
      Object.entries(seasonPatterns).forEach(([group, patterns]) => {
        const matched = patterns.some(pattern => {
          const candidate = canonicalRoot(pattern);
          return canonical === candidate || (candidate.length >= 4 && canonical.includes(candidate));
        });
        if (matched) groups.add(group);
      });
    });
    return [...groups].sort();
  }

  function seasonJudgement(rootList, month) {
    const groups = seasonGroupsForRoots(rootList);
    const labels = [];
    const guardReasons = [];
    const schedules = {
      '冬季': [new Set([11, 12, 1, 2]), new Set([9, 10])],
      '夏季': [new Set([5, 6, 7, 8]), new Set([3, 4])],
      '春季': [new Set([3, 4, 5]), new Set([1, 2])],
      '秋季/换季': [new Set([8, 9, 10]), new Set([6, 7])],
    };
    groups.forEach(group => {
      if (group === '天气驱动' || group === '气温驱动') {
        labels.push(group);
        guardReasons.push(`${group}需求可能随天气和气温变化`);
        return;
      }
      const [peak, preseason] = schedules[group];
      if (peak.has(month)) labels.push(`${group}词（当季）`);
      else if (preseason.has(month)) {
        labels.push(`${group}词（临近旺季）`);
        guardReasons.push(`${group}旺季尚未完全到来`);
      } else {
        labels.push(`${group}词（当前非旺季）`);
        guardReasons.push(`当前不在${group}主要旺季`);
      }
    });
    return [labels.length ? labels.join('；') : '非明显季节词', guardReasons];
  }

  function inferReportPeriod(filename) {
    const match = cleanText(filename).match(/(?:^|\D)(\d{2})(\d{2})[-_](\d{2})(\d{2})(?!\d)/);
    return match ? `${match[1]}/${match[2]}–${match[3]}/${match[4]}` : '按上传报告';
  }

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function analyzeMatrix(matrix, options = {}) {
    if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) {
      throw new Error('Excel 中没有可读取的数据');
    }

    const sourceFilename = cleanText(options.sourceFilename) || '搜索词报告.xlsx';
    const analysisTime = options.analysisTime instanceof Date ? options.analysisTime : new Date();
    const analysisMonth = analysisTime.getMonth() + 1;
    const productTitles = normalizeEntries(options.productTitles || options.titles || [], /[\r\n；;]+/);
    const productSt = normalizeEntries(options.productSt || options.searchTerms || [], /[\r\n,，；;]+/);
    const contextProvided = Boolean(productTitles.length || productSt.length);

    const rawHeaders = matrix[0].map(value => value === null || value === undefined ? null : String(value));
    const headerIndex = new Map();
    matrix[0].forEach((value, index) => headerIndex.set(normalizeHeader(value), index));
    const resolved = {};
    Object.entries(columnSpecs).forEach(([canonical, [aliases, required]]) => {
      let found = null;
      for (const alias of aliases) {
        const index = headerIndex.get(normalizeHeader(alias));
        if (index !== undefined) {
          found = index;
          break;
        }
      }
      if (found === null && required) {
        const available = matrix[0].map(cleanText).filter(Boolean).join('、');
        throw new Error(`报告缺少必要字段。需要其中一个：${aliases.join('、')}。当前字段：${available}`);
      }
      resolved[canonical] = found;
    });

    const getValue = (row, column) => resolved[column] === null ? null : row[resolved[column]];
    const detail = [];
    matrix.slice(1).forEach(row => {
      const searchTerm = getValue(row, '用户搜索词');
      if (!cleanText(searchTerm)) return;
      detail.push({
        '关键词': getValue(row, '关键词'),
        '用户搜索词': searchTerm,
        '曝光量': numeric(getValue(row, '曝光量')),
        '点击': numeric(getValue(row, '点击')),
        '花费': numeric(getValue(row, '花费')),
        '广告订单': numeric(getValue(row, '广告订单')),
        '广告销售额': numeric(getValue(row, '广告销售额')),
        '广告销量': numeric(getValue(row, '广告销量')),
        '中文翻译': getValue(row, '中文翻译'),
        '匹配方式': getValue(row, '匹配方式'),
        '用户搜索词是否否定': getValue(row, '用户搜索词是否否定'),
        '关键词是否否定': getValue(row, '关键词是否否定'),
      });
    });
    if (!detail.length) throw new Error('报告中没有可分析的用户搜索词明细');

    const titleRootCounts = countContextRoots(productTitles);
    const stRootCounts = countContextRoots(productSt);
    const contextRootKeys = [...new Set([...titleRootCounts.keys(), ...stRootCounts.keys()])].sort();
    const productRootMeta = new Map();
    contextRootKeys.forEach(word => {
      const titleCount = titleRootCounts.get(word) || 0;
      const stCount = stRootCounts.get(word) || 0;
      const totalCount = titleCount + stCount;
      const focus = (titleCount > 0 && stCount > 0) || totalCount >= 2 || canonicalCoreRoots.has(word);
      const sourceLabel = titleCount && stCount ? '标题与ST' : (titleCount ? '标题' : 'ST');
      let focusReason = '产品相关词';
      if (titleCount && stCount) focusReason = '标题与ST同时出现';
      else if (totalCount >= 2) focusReason = '在多个标题/ST中重复出现';
      else if (canonicalCoreRoots.has(word)) focusReason = '核心品类或人群词';
      productRootMeta.set(word, {
        '词根': word, '标题出现次数': titleCount, 'ST出现次数': stCount, '总出现次数': totalCount,
        '来源': sourceLabel, '重点词': focus, '重点依据': focusReason,
      });
    });

    function matchedContextRoots(rootList) {
      const matched = new Set();
      rootList.forEach(word => {
        const canonical = canonicalRoot(word);
        contextRootKeys.forEach(contextRoot => {
          if (rootsAreRelated(canonical, contextRoot)) matched.add(contextRoot);
        });
      });
      return [...matched].sort();
    }

    const productVocabulary = contextRootKeys.map(word => {
      const meta = productRootMeta.get(word);
      const seasonGroups = seasonGroupsForRoots([word]);
      return {
        ...meta,
        '季节属性': seasonGroups.length ? seasonGroups.join('、') : '非明显季节词',
        '保护方式': meta['重点词'] ? '禁止自动词组否定；极差时仅做精准人工复核' : '不做词组否定；搜索词层级结合其他词复核',
      };
    }).sort((a, b) => Number(a['重点词']) - Number(b['重点词']) || b['总出现次数'] - a['总出现次数'] || a['词根'].localeCompare(b['词根']));
    productVocabulary.sort((a, b) => Number(b['重点词']) - Number(a['重点词']) || b['总出现次数'] - a['总出现次数'] || a['词根'].localeCompare(b['词根']));
    const focusRoots = productVocabulary.filter(item => item['重点词']).map(item => item['词根']);

    const sumField = field => detail.reduce((total, row) => total + row[field], 0);
    const overallSpend = sumField('花费');
    const overallSales = sumField('广告销售额');
    const overallOrders = sumField('广告订单');
    const overallClicks = sumField('点击');
    const overallImpressions = sumField('曝光量');
    const overallAcos = overallSales ? overallSpend / overallSales : null;
    const overallCvr = overallClicks ? overallOrders / overallClicks : null;
    const expectedClicksPerOrder = overallCvr && overallCvr > 0 ? Math.max(10, Math.min(40, roundUp(1 / overallCvr))) : 20;

    function dataMaturity(clicks, spend, sales, orders) {
      if (sales > 0 || orders > 0) return clicks < expectedClicksPerOrder ? '已有转化但样本较少' : '已有转化数据';
      if (clicks < 10 || spend < 5) return '数据不足';
      if (clicks < expectedClicksPerOrder || spend < 10) return '样本偏少';
      if (clicks < Math.max(30, roundUp(expectedClicksPerOrder * 1.5)) || spend < 20) return '中等证据';
      return '证据较充分';
    }

    function productRelevance(rootList) {
      const informative = rootList.map(canonicalRoot).filter(item => !stopwords.has(item) && item.length > 2 && !/^\d+$/.test(item));
      const hits = matchedContextRoots(rootList);
      const focusHits = hits.filter(item => productRootMeta.get(item)?.['重点词']);
      const distinctiveHits = focusHits.filter(contextRoot => !genericProductRoots.has(contextRoot) && rootList.some(token => {
        const canonical = canonicalRoot(token);
        return !genericProductRoots.has(canonical) && rootsAreRelated(token, contextRoot);
      }));
      const matchedTokenCount = informative.filter(token => hits.some(hit => rootsAreRelated(token, hit))).length;
      const coverage = informative.length ? matchedTokenCount / informative.length : 0;
      const unrelatedBrand = rootList.some(word => canonicalBrandRoots.has(canonicalRoot(word)) && !hits.some(hit => rootsAreRelated(word, hit)));
      let label;
      let strong = false;
      if (!contextProvided) label = '未提供标题/ST';
      else if (distinctiveHits.length && !unrelatedBrand) { label = '强相关（命中产品重点词）'; strong = true; }
      else if (focusHits.length && coverage >= 0.8 && !unrelatedBrand) { label = '强相关（主要由重点词组成）'; strong = true; }
      else if (hits.length) label = '部分相关（含产品词）';
      else label = '未命中产品词';
      return { hits, focusHits, distinctiveHits, coverage, unrelatedBrand, label, strong };
    }

    const groups = new Map();
    detail.forEach(row => {
      const key = normSearch(row['用户搜索词']);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    const terms = [];
    groups.forEach((group, key) => {
      if (!key) return;
      const userStatuses = unique(group.map(row => cleanText(row['用户搜索词是否否定'])).filter(Boolean));
      const keywordStatuses = unique(group.map(row => cleanText(row['关键词是否否定'])).filter(Boolean));
      const keywordPairs = group.map(row => [cleanText(row['关键词']), cleanText(row['关键词是否否定'])]).filter(([keyword]) => Boolean(keyword));
      const keywordValues = unique(keywordPairs.map(([keyword]) => keyword));
      const allKeywordsNegative = keywordPairs.length > 0 && keywordPairs.every(([, status]) => Boolean(status));
      const rootList = tokenize(key);
      const relevance = productRelevance(rootList);
      const [seasonLabel, seasonGuards] = seasonJudgement(rootList, analysisMonth);
      const spend = group.reduce((total, row) => total + row['花费'], 0);
      const sales = group.reduce((total, row) => total + row['广告销售额'], 0);
      const orders = group.reduce((total, row) => total + row['广告订单'], 0);
      const clicks = group.reduce((total, row) => total + row['点击'], 0);
      const maturity = dataMaturity(clicks, spend, sales, orders);
      const protection = [];
      if (relevance.strong) protection.push('产品重点词保护');
      else if (relevance.hits.length) protection.push('产品相关词复核');
      if (seasonGuards.length) protection.push('季节/天气保护');
      if (sales === 0 && ['数据不足', '样本偏少'].includes(maturity)) protection.push('数据尚未成熟');
      terms.push({
        '搜索词': cleanText(group[0]['用户搜索词']), '标准化搜索词': key,
        '中文翻译': group.map(row => cleanText(row['中文翻译'])).find(Boolean) || '',
        '词根拆分': rootList.join(' | '), '词根列表': rootList,
        '匹配方式': unique(group.map(row => cleanText(row['匹配方式'])).filter(Boolean)).join('/'),
        '关键词': keywordValues.join('；'), '关键词否定状态': keywordStatuses.join('；'),
        '对应关键词已否定': allKeywordsNegative, '用户搜索词否定状态': userStatuses.join('；'),
        '报表行数': group.length, '曝光量': group.reduce((total, row) => total + row['曝光量'], 0),
        '点击': clicks, '花费': spend, '广告订单': orders, '广告销售额': sales,
        '否定状态': userStatuses.join('/'), '已否定': Boolean(userStatuses.length),
        '命中产品词': relevance.hits.join('、'), '命中重点词': relevance.focusHits.join('、'),
        '产品相关性': relevance.label, '相关性强保护': relevance.strong,
        '含非本品牌/用途词': relevance.unrelatedBrand, '季节性判断': seasonLabel,
        '季节保护原因': seasonGuards, '数据成熟度': maturity,
        '保护状态': protection.length ? protection.join('、') : '无额外保护',
        'ACOS_value': sales > 0 ? spend / sales : null,
        'CVR_value': clicks > 0 ? orders / clicks : null,
      });
    });
    if (!terms.length) throw new Error('报告中没有可分析的用户搜索词明细');

    const rootMap = new Map();
    terms.forEach(term => term['词根列表'].forEach(word => {
      if (!rootMap.has(word)) rootMap.set(word, {
        '词根': word, terms: new Set(), '曝光量': 0, '点击': 0, '花费': 0, '广告订单': 0,
        '广告销售额': 0, '已否定搜索词数': 0,
      });
      const item = rootMap.get(word);
      item.terms.add(term['标准化搜索词']);
      item['曝光量'] += term['曝光量'];
      item['点击'] += term['点击'];
      item['花费'] += term['花费'];
      item['广告订单'] += term['广告订单'];
      item['广告销售额'] += term['广告销售额'];
      item['已否定搜索词数'] += term['已否定'] ? 1 : 0;
    }));

    function baseRootRisk(row) {
      const spend = row['花费'];
      const sales = row['广告销售额'];
      const acos = row['ACOS_value'];
      if (sales === 0 && spend >= 10) return '无销售高风险';
      if (acos !== null && spend >= 20 && acos >= 0.5) return 'ACOS≥50%';
      if (acos !== null && spend >= 30 && acos >= 0.3) return 'ACOS 30%-50%';
      if (acos !== null && overallAcos !== null && spend >= 30 && acos <= overallAcos) return '优于整体ACOS';
      return '观察';
    }

    const rootRecords = [...rootMap.values()].map(item => {
      const row = { ...item, '搜索词数': item.terms.size };
      delete row.terms;
      row['ACOS_value'] = row['广告销售额'] > 0 ? row['花费'] / row['广告销售额'] : null;
      row['CVR_value'] = row['点击'] > 0 ? row['广告订单'] / row['点击'] : null;
      const hits = matchedContextRoots([row['词根']]);
      const focusHits = hits.filter(hit => productRootMeta.get(hit)?.['重点词']);
      const titleCount = hits.length ? Math.max(...hits.map(hit => productRootMeta.get(hit)['标题出现次数'])) : 0;
      const stCount = hits.length ? Math.max(...hits.map(hit => productRootMeta.get(hit)['ST出现次数'])) : 0;
      const [seasonLabel, seasonGuards] = seasonJudgement([row['词根']], analysisMonth);
      const maturity = dataMaturity(row['点击'], row['花费'], row['广告销售额'], row['广告订单']);
      const protection = [];
      if (focusHits.length) protection.push('重点词保护');
      else if (hits.length) protection.push('产品相关词保护');
      if (canonicalCoreRoots.has(canonicalRoot(row['词根']))) protection.push('核心品类词保护');
      if (canonicalAttributeRoots.has(canonicalRoot(row['词根']))) protection.push('属性词保护');
      if (seasonGuards.length) protection.push('季节/天气保护');
      if (row['广告销售额'] === 0 && ['数据不足', '样本偏少'].includes(maturity)) protection.push('数据尚未成熟');
      Object.assign(row, {
        '产品相关性': focusHits.length ? '重点词相关' : (hits.length ? '产品相关' : (contextProvided ? '未命中产品词' : '未提供标题/ST')),
        '标题出现次数': titleCount, 'ST出现次数': stCount, '重点词': focusHits.length ? '是' : '否',
        '季节属性': seasonGroupsForRoots([row['词根']]).join('、') || '非明显季节词',
        '季节性判断': seasonLabel, '数据成熟度': maturity,
        '保护状态': protection.length ? unique(protection).join('、') : '无额外保护',
        '风险状态': baseRootRisk(row),
      });
      return row;
    }).sort((a, b) => b['花费'] - a['花费'] || b['广告销售额'] - a['广告销售额']);

    function recommendationRecord(target, action, priority, level, metrics, status, relevanceLabel, seasonLabel, maturity, searchTermCount = 1, protectionBasis = '') {
      return {
        '建议类型': action, '优先级': priority, '否词词根/词组': target, '层级': level,
        '花费': Number(metrics['花费']), '广告销售额': Number(metrics['广告销售额']),
        '广告订单': Number(metrics['广告订单']), '点击': Number(metrics['点击']),
        'ACOS_value': metrics['ACOS_value'], '搜索词数': Number(searchTermCount),
        '对应关键词': metrics['关键词'] || '', '关键词状态': metrics['关键词状态'] || '',
        '用户搜索词否定状态': metrics['用户搜索词否定状态'] || '', '产品相关性': relevanceLabel,
        '季节性判断': seasonLabel, '数据成熟度': maturity, '保护依据': protectionBasis,
        '原因': metrics['说明'], '状态': status,
      };
    }

    function metricsReason(row, explanation) {
      return {
        '花费': row['花费'], '广告销售额': row['广告销售额'], '广告订单': row['广告订单'],
        '点击': row['点击'], 'ACOS_value': row['ACOS_value'], '关键词': row['关键词'] || '',
        '关键词状态': row['关键词否定状态'] || '', '用户搜索词否定状态': row['用户搜索词否定状态'] || '',
        '说明': explanation,
      };
    }

    function basePhraseTrigger(row) {
      const spend = row['花费'];
      const sales = row['广告销售额'];
      const acos = row['ACOS_value'];
      if (sales === 0 && spend >= 10) return ['高优先', '累计花费较高但没有广告销售额'];
      if (acos !== null && spend >= 20 && acos >= 0.5) return ['高优先', `ACOS ${formatPercent(acos)}，明显偏高`];
      if (acos !== null && spend >= 30 && acos >= 0.3) return ['确认后', `ACOS ${formatPercent(acos)}，需要结合相关性复核`];
      return null;
    }

    const phraseRecs = [];
    const protectedRootRecs = [];
    rootRecords.forEach(row => {
      const trigger = basePhraseTrigger(row);
      if (!trigger) return;
      const word = row['词根'];
      const canonical = canonicalRoot(word);
      if (stopwords.has(canonical) || canonical.length <= 2 || /^\d+$/.test(canonical)) return;
      const [priority, triggerReason] = trigger;
      const protections = [];
      if (row['重点词'] === '是') protections.push('标题/ST重点词');
      else if (row['产品相关性'] === '产品相关') protections.push('标题/ST产品相关词');
      if (canonicalCoreRoots.has(canonical)) protections.push('核心品类或人群词');
      if (canonicalAttributeRoots.has(canonical)) protections.push('颜色、尺码、功能或季节属性词');
      protections.push(...seasonJudgement([word], analysisMonth)[1]);
      if (row['广告销售额'] === 0 && ['数据不足', '样本偏少'].includes(row['数据成熟度'])) {
        protections.push(`${row['数据成熟度']}，尚未达到约 ${expectedClicksPerOrder} 次点击的常规转化观察量`);
      }
      const finalProtections = unique(protections);
      if (finalProtections.length) {
        const explanation = `${triggerReason}，但该词属于${finalProtections.join('；')}。先降低竞价或等待相应季节并继续观察，避免大范围切断相关流量。`;
        protectedRootRecs.push(recommendationRecord(word, '暂缓词组否定', '保护观察', '词根', metricsReason(row, explanation), '暂缓否定', row['产品相关性'], row['季节性判断'], row['数据成熟度'], row['搜索词数'], finalProtections.join('；')));
        return;
      }
      let action;
      let reasonText;
      let status;
      if (canonicalBrandRoots.has(canonical)) {
        action = '词组否定（确认非本品牌/非目标用途）';
        reasonText = `品牌、竞品或特定用途词根，${triggerReason}。确认不属于自有品牌或目标用途后再执行。`;
        status = '建议复核';
      } else {
        action = '词组否定';
        const overallLabel = overallAcos !== null ? formatPercent(overallAcos) : 'n.a.';
        reasonText = `${triggerReason}，且未命中标题/ST产品词；整体 ACOS 为 ${overallLabel}。`;
        status = priority === '高优先' ? '建议执行' : '建议复核';
      }
      phraseRecs.push(recommendationRecord(word, action, priority, '词根', metricsReason(row, reasonText), status, row['产品相关性'], row['季节性判断'], row['数据成熟度'], row['搜索词数']));
    });
    phraseRecs.sort((a, b) => (a['优先级'] === '高优先' ? 0 : 1) - (b['优先级'] === '高优先' ? 0 : 1) || b['花费'] - a['花费'] || (b['ACOS_value'] ?? 9) - (a['ACOS_value'] ?? 9));
    phraseRecs.splice(30);
    const highPhraseRoots = new Set(phraseRecs.filter(item => item['状态'] === '建议执行' && item['建议类型'].startsWith('词组否定')).map(item => item['否词词根/词组']));

    function baseExactTrigger(row) {
      const spend = row['花费'];
      const sales = row['广告销售额'];
      const acos = row['ACOS_value'];
      const clicks = row['点击'];
      const orders = row['广告订单'];
      if (sales === 0 && spend >= 5 && clicks >= 10) return ['高优先', `无广告销售额，累计花费 €${spend.toFixed(2)}，点击 ${Math.trunc(clicks)} 次`];
      if (acos !== null && spend >= 10 && acos >= 0.5 && orders <= 3) return ['高优先', `ACOS ${formatPercent(acos)}，仅 ${Math.trunc(orders)} 单`];
      if (acos !== null && spend >= 15 && acos >= 0.3 && orders <= 3) return ['确认后', `ACOS ${formatPercent(acos)}，转化订单较少`];
      return null;
    }

    const exactRecs = [];
    const protectedTermRecs = [];
    [...terms].sort((a, b) => b['花费'] - a['花费'] || a['广告销售额'] - b['广告销售额']).forEach(row => {
      if (row['已否定'] || row['对应关键词已否定']) return;
      const trigger = baseExactTrigger(row);
      if (!trigger) return;
      const [priority, triggerReason] = trigger;
      const relevance = productRelevance(row['词根列表']);
      const [seasonLabel, seasonGuards] = seasonJudgement(row['词根列表'], analysisMonth);
      const maturity = row['数据成熟度'];
      const canonicalTokens = new Set(row['词根列表'].map(canonicalRoot));
      const informativeTokens = [...canonicalTokens].filter(item => !stopwords.has(item) && item.length > 2 && !/^\d+$/.test(item));
      const coreCoverage = informativeTokens.length ? informativeTokens.filter(item => canonicalCoreRoots.has(item)).length / informativeTokens.length : 0;
      const hasAttribute = [...canonicalTokens].some(item => canonicalAttributeRoots.has(item));
      const extremeZero = row['广告销售额'] === 0 && row['花费'] >= 30 && row['点击'] >= Math.max(40, expectedClicksPerOrder * 2);
      const extremeAcos = row['ACOS_value'] !== null && row['ACOS_value'] >= 1 && row['花费'] >= 30 && row['点击'] >= expectedClicksPerOrder && row['广告订单'] <= 2;
      const extreme = extremeZero || extremeAcos;
      const protections = [];
      if (relevance.strong && !relevance.unrelatedBrand) protections.push('搜索词主要由标题/ST重点词组成');
      else if (coreCoverage >= 0.8 && !relevance.unrelatedBrand) protections.push('搜索词主要由核心品类或人群词组成');
      protections.push(...seasonGuards);
      if (row['广告销售额'] === 0 && ['数据不足', '样本偏少'].includes(maturity)) protections.push(`${maturity}，尚未达到约 ${expectedClicksPerOrder} 次点击的常规转化观察量`);
      const finalProtections = unique(protections);

      if (finalProtections.length && !extreme) {
        const explanation = `${triggerReason}，但${finalProtections.join('；')}。当前不建议直接否定，先观察季节变化、降低竞价，并检查价格、评价和详情页转化。`;
        protectedTermRecs.push(recommendationRecord(row['搜索词'], '暂缓精准否定', '保护观察', '搜索词', metricsReason(row, explanation), '暂缓否定', row['产品相关性'], seasonLabel, maturity, 1, finalProtections.join('；')));
        return;
      }

      let action;
      let finalPriority;
      let status;
      let reasonText;
      let protectionBasis = '';
      if (finalProtections.length && extreme) {
        action = '精准否定（保护词极差，人工复核）';
        finalPriority = '严格复核';
        status = '建议复核';
        protectionBasis = finalProtections.join('；');
        reasonText = `${triggerReason}，证据已达到极差阈值；但${protectionBasis}，只建议在搜索词层级人工复核，不做词组否定。`;
      } else {
        const overlap = row['词根列表'].some(word => highPhraseRoots.has(word));
        action = overlap ? '精准否定（若暂不做词组否定）' : '精准否定';
        finalPriority = priority;
        const needsReview = relevance.hits.length > 0 || hasAttribute || priority === '确认后' || seasonLabel.includes('当季');
        if (needsReview) {
          action = '精准否定（确认与产品不匹配）';
          status = '建议复核';
          finalPriority = '确认后';
        } else status = priority === '高优先' ? '建议执行' : '建议复核';
        const overallLabel = overallAcos !== null ? formatPercent(overallAcos) : 'n.a.';
        reasonText = `${triggerReason}，整体 ACOS 为 ${overallLabel}。`;
        if (relevance.hits.length) reasonText += '搜索词含部分产品相关词，执行前需确认其余词是否造成意图偏离。';
        else if (hasAttribute) reasonText += '含颜色、尺码或功能属性，先确认该属性是否确实不适用。';
      }
      exactRecs.push(recommendationRecord(row['搜索词'], action, finalPriority, '搜索词', metricsReason(row, reasonText), status, row['产品相关性'], seasonLabel, maturity, 1, protectionBasis));
    });
    exactRecs.sort((a, b) => (a['优先级'] === '高优先' ? 0 : 1) - (b['优先级'] === '高优先' ? 0 : 1) || b['花费'] - a['花费'] || (b['ACOS_value'] ?? 9) - (a['ACOS_value'] ?? 9));
    exactRecs.splice(50);
    protectedRootRecs.sort((a, b) => b['花费'] - a['花费']);
    protectedTermRecs.sort((a, b) => b['花费'] - a['花费']);
    const protectedRecs = [...protectedRootRecs, ...protectedTermRecs].sort((a, b) => b['花费'] - a['花费']);

    const exactRecMap = new Map(exactRecs.map(item => [normSearch(item['否词词根/词组']), item]));
    const protectedTermMap = new Map(protectedTermRecs.map(item => [normSearch(item['否词词根/词组']), item]));
    terms.forEach(row => {
      const key = row['标准化搜索词'];
      let action;
      let reason;
      if (row['已否定']) { action = '用户搜索词已否定'; reason = '报告中的“用户搜索词是否否定”已标记，建议保持并定期复核。'; }
      else if (row['对应关键词已否定']) { action = '对应关键词已否定'; reason = '报告中的“关键词是否否定”属于对应投放关键词；用户搜索词本身未标记否定，因此不重复生成精准否词。'; }
      else if (exactRecMap.has(key)) { action = exactRecMap.get(key)['建议类型']; reason = exactRecMap.get(key)['原因']; }
      else if (protectedTermMap.has(key)) { action = '暂缓否定'; reason = protectedTermMap.get(key)['原因']; }
      else if (row['相关性强保护']) { action = '保留观察'; reason = '搜索词主要由标题/ST重点词组成。若表现不佳，先调低竞价并优化价格、评价或详情页。'; }
      else if (row['季节保护原因'].length) { action = '季节性观察'; reason = `${row['季节性判断']}，当前表现可能受季节、气温或天气影响。`; }
      else if (row['广告销售额'] === 0 && row['花费'] > 0) { action = '观察'; reason = `有花费但暂无广告销售额；当前数据成熟度为“${row['数据成熟度']}”，继续积累数据或降低竞价。`; }
      else if (row['ACOS_value'] !== null && overallAcos !== null && row['ACOS_value'] > overallAcos) { action = '保留观察'; reason = `ACOS 高于整体 ${formatPercent(overallAcos)}，但当前证据不足以直接否定。`; }
      else { action = '保留'; reason = 'ACOS 不高于整体，或已有有效转化，保留流量。'; }
      row['建议'] = action;
      row['建议原因'] = reason;
    });

    const termColumns = ['搜索词', '中文翻译', '词根拆分', '匹配方式', '报表行数', '曝光量', '点击', '花费', '广告订单', '广告销售额', '否定状态', '命中产品词', '命中重点词', '产品相关性', '季节性判断', '数据成熟度', '保护状态', '建议', '建议原因', 'ACOS_value', 'CVR_value', '关键词', '用户搜索词否定状态', '关键词否定状态', '对应关键词已否定'];
    const rootColumns = ['词根', '搜索词数', '曝光量', '点击', '花费', '广告订单', '广告销售额', '已否定搜索词数', '风险状态', '产品相关性', '标题出现次数', 'ST出现次数', '重点词', '季节属性', '季节性判断', '数据成熟度', '保护状态', 'ACOS_value', 'CVR_value'];
    const recommendationColumns = ['建议类型', '优先级', '否词词根/词组', '层级', '花费', '广告销售额', '广告订单', '点击', 'ACOS_value', '搜索词数', '对应关键词', '关键词状态', '用户搜索词否定状态', '产品相关性', '季节性判断', '数据成熟度', '保护依据', '原因', '状态'];
    const productColumns = ['词根', '标题出现次数', 'ST出现次数', '总出现次数', '来源', '重点词', '重点依据', '季节属性', '保护方式'];
    const recommendations = [...phraseRecs, ...exactRecs, ...protectedRecs];
    const normalizedRawRecords = matrix.slice(1).map(row => Array.from({ length: rawHeaders.length }, (_, index) => row[index] ?? null));

    return {
      source_filename: sourceFilename,
      report_period: inferReportPeriod(sourceFilename),
      analysis_date: localDateString(analysisTime),
      overall: {
        detail_rows: detail.length, unique_search_terms: terms.length, impressions: overallImpressions,
        clicks: overallClicks, spend: overallSpend, orders: overallOrders, sales: overallSales,
        acos: overallAcos, cvr: overallCvr,
        negative_term_rows: detail.filter(row => Boolean(cleanText(row['用户搜索词是否否定']))).length,
        negative_keyword_rows: detail.filter(row => Boolean(cleanText(row['关键词是否否定']))).length,
        root_count: rootRecords.length, focus_root_count: focusRoots.length, related_root_count: productVocabulary.length,
        protected_recommendation_count: protectedRecs.length, expected_clicks_per_order: expectedClicksPerOrder,
      },
      product_context: {
        provided: contextProvided, titles: productTitles, search_terms: productSt, focus_roots: focusRoots,
        related_roots: productVocabulary.map(item => item['词根']), analysis_month: analysisMonth,
      },
      product_headers: productColumns,
      product_records: productVocabulary.map(item => productColumns.map(column => item[column] ?? null)),
      term_headers: termColumns,
      term_records: terms.map(item => termColumns.map(column => item[column] ?? null)),
      root_headers: rootColumns,
      root_records: rootRecords.map(item => rootColumns.map(column => item[column] ?? null)),
      recommendation_headers: recommendationColumns,
      recommendation_records: recommendations.map(item => recommendationColumns.map(column => item[column] ?? null)),
      phrase_recs: phraseRecs,
      exact_recs: exactRecs,
      protected_recs: protectedRecs,
      raw_headers: rawHeaders,
      raw_records: normalizedRawRecords,
    };
  }

  function workbookToMatrix(arrayBuffer) {
    if (!root.XLSX) throw new Error('Excel 处理组件未加载，请刷新页面后重试');
    const workbook = root.XLSX.read(arrayBuffer, { type: 'array', cellDates: true, raw: true });
    if (!workbook.SheetNames?.length) throw new Error('Excel 中没有工作表');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return root.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true, blankrows: false });
  }

  function analyzeWorkbook(arrayBuffer, options = {}) {
    return analyzeMatrix(workbookToMatrix(arrayBuffer), options);
  }

  root.AcosAnalysis = {
    analyzeMatrix,
    analyzeWorkbook,
    canonicalRoot,
    inferReportPeriod,
    normSearch,
    seasonGroupsForRoots,
    seasonJudgement,
    tokenize,
  };
}(typeof window !== 'undefined' ? window : globalThis));
