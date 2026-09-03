import { SUBJECTS } from './data.js';

export function filterSchools(schools, filter, userScore) {
  const { selectedSubjects, minACount, minBCount, searchQuery, tierFilter, categoryFilter } = filter;

  let results = schools.filter(function(s) {
    if (selectedSubjects.length > 0) {
      var hasMatch = s.majors.some(function(m) {
        if (m.requiredSubjects.length === 0) return true;
        return m.requiredSubjects.every(function(sub) { return selectedSubjects.indexOf(sub) !== -1; });
      });
      if (!hasMatch) return false;
    }
    if (minACount > 0 || minBCount > 0) {
      var req = (s.admission[0] && s.admission[0].xuekaoRequirement) || '';
      var aMatch = req.match(/(\d+)A/);
      var bMatch = req.match(/(\d+)B/);
      var rA = aMatch ? parseInt(aMatch[1]) : 0;
      var rB = bMatch ? parseInt(bMatch[1]) : 0;
      if (minACount < rA || (minACount + minBCount) < (rA + rB)) return false;
    }
    if (searchQuery.trim()) {
      var q = searchQuery.toLowerCase();
      var nameMatch = s.name.toLowerCase().indexOf(q) !== -1;
      var shortMatch = s.shortName.toLowerCase().indexOf(q) !== -1;
      var aliasMatch = s.aliases.some(function(a) { return a.toLowerCase().indexOf(q) !== -1; });
      if (!nameMatch && !shortMatch && !aliasMatch) return false;
    }
    if (categoryFilter && !s.majors.some(function(m) { return m.category === categoryFilter; })) return false;
    return true;
  });

  results = results.map(function(s) {
    var tier = 'match';
    if (userScore && s.admission[0] && s.admission[0].minScore) {
      var diff = userScore - s.admission[0].minScore;
      if (diff > 5) tier = 'safety';
      else if (diff < -5) tier = 'reach';
    }
    return { school: s, tier: tier };
  });

  if (tierFilter !== 'all') {
    results = results.filter(function(r) { return r.tier === tierFilter; });
  }
  return results;
}

export function calcXuekao(grades, formula) {
  return grades.reduce(function(sum, g) {
    return sum + (formula.xuekao[g.grade] || 0);
  }, 0);
}

export function calcComprehensive(input, school) {
  var formula = school.formula;
  if (!formula) return null;
  var xk = calcXuekao(input.xuekaoGrades, formula);
  var xs = input.xiaokaoScore || 0;
  var gk = input.gaokaoScore || 0;
  var gkNormalized = (gk / formula.gaokao.fullScore) * 100;
  var score = xk * formula.weights.xuekao + xs * formula.weights.xiaokao + gkNormalized * formula.weights.gaokao;
  var tier = 'match';
  if (school.admission[0] && school.admission[0].minScore) {
    var diff = score - school.admission[0].minScore;
    if (diff > 5) tier = 'safety';
    else if (diff < -5) tier = 'reach';
  }
  return {
    xuekaoConverted: xk,
    xuekaoFullScore: formula.xuekao.fullScore,
    xiaokaoNormalized: xs,
    gaokaoNormalized: Math.round(gkNormalized * 100) / 100,
    comprehensiveScore: Math.round(score * 100) / 100,
    tier: tier
  };
}

export function reverseCalcGaokao(targetScore, grades, xiaokaoScore, school) {
  var formula = school.formula;
  if (!formula) return null;
  var xkPart = calcXuekao(grades, formula) * formula.weights.xuekao;
  var xsPart = xiaokaoScore * formula.weights.xiaokao;
  var needed = targetScore - xkPart - xsPart;
  if (needed < 0) return 0;
  return Math.ceil((needed / formula.weights.gaokao) * (formula.gaokao.fullScore / 100));
}

export function reverseCalcXiaokao(targetScore, grades, gaokaoScore, school) {
  var formula = school.formula;
  if (!formula) return null;
  var xkPart = calcXuekao(grades, formula) * formula.weights.xuekao;
  var gkNormalized = (gaokaoScore / formula.gaokao.fullScore) * 100;
  var gkPart = gkNormalized * formula.weights.gaokao;
  var needed = targetScore - xkPart - gkPart;
  if (needed < 0) return 0;
  return Math.round((needed / formula.weights.xiaokao) * 100) / 100;
}
