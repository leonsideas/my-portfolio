type DatedProject = { slug: string; year: string | null; title: string }

const sameYearOrder = ['Reefresh', 'Uebergangsobjekte', 'Portfolio']

function sameYearPriority(slug: string): number {
  const index = sameYearOrder.indexOf(slug)
  return index < 0 ? sameYearOrder.length : index
}

export function compareProjectsByYear(a: DatedProject, b: DatedProject): number {
  return (Number(b.year) || 0) - (Number(a.year) || 0)
    || sameYearPriority(a.slug) - sameYearPriority(b.slug)
    || a.title.localeCompare(b.title, 'de')
}
