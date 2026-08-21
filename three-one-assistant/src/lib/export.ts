import type { School, Major } from '@/types'

export function generateMarkdown(schools: School[]): string {
  const lines: string[] = ['# 我的三位一体方案', '', `生成时间：${new Date().toLocaleDateString('zh-CN')}`, '']

  for (const school of schools) {
    lines.push(`## ${school.name}（${school.shortName}）`)
    lines.push('')
    lines.push('### 基本信息')
    lines.push(`- 校区：${school.info.campuses.map((c) => `${c.name}（${c.address}）`).join('、')}`)
    lines.push(`- 学费：${school.info.tuitionGeneral}`)
    if (school.info.tuitionSinoForeign) {
      lines.push(`- 中外合作办学：${school.info.tuitionSinoForeign}`)
    }
    if (school.info.healthRestrictions) {
      lines.push(`- ⚠️ 体检限制：${school.info.healthRestrictions}`)
    }
    lines.push(`- 招生咨询电话：${school.info.admissionsPhone}`)
    lines.push('')
    lines.push('### 校测内容')
    lines.push(`- 笔试：${school.examFormat.hasWrittenTest ? '有' : '无'}`)
    lines.push(`- 面试：${school.examFormat.hasInterview ? '有' : '无'}`)
    lines.push(`- 体测：${school.examFormat.hasPhysicalTest ? '有' : '无'}`)
    lines.push(`- 内容概要：${school.examFormat.contentSummary}`)
    lines.push('')
    lines.push('### 转专业限制')
    lines.push(`- ${school.transferRestriction.detail}`)
    lines.push('')
    if (school.admission.length > 0) {
      lines.push('### 历年竞争比')
      for (const ad of school.admission) {
        lines.push(`- ${ad.year}年：报名${ad.applicants}人 → 入围${ad.passed}人 → 录取${ad.admitted}人`)
      }
      lines.push('')
    }
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

export function downloadMarkdown(content: string, filename: string = '三位一体方案.md') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function generateCompareMd(schools: School[]): string {
  const lines: string[] = ['# 院校对比报告', '', `生成时间：${new Date().toLocaleDateString('zh-CN')}`, '']
  lines.push('| 项目 | ' + schools.map((s) => s.shortName).join(' | ') + ' |')
  lines.push('|------|' + schools.map(() => '------').join('|') + '|')
  lines.push('| 校区 | ' + schools.map((s) => s.info.campuses[0]?.name || '-').join(' | ') + ' |')
  lines.push('| 学费 | ' + schools.map((s) => s.info.tuitionGeneral).join(' | ') + ' |')
  lines.push('| 笔试 | ' + schools.map((s) => s.examFormat.hasWrittenTest ? '有' : '无').join(' | ') + ' |')
  lines.push('| 面试 | ' + schools.map((s) => s.examFormat.hasInterview ? '有' : '无').join(' | ') + ' |')
  lines.push('| 转专业限制 | ' + schools.map((s) => s.transferRestriction.restricted ? '是' : '否').join(' | ') + ' |')
  return lines.join('\n')
}
