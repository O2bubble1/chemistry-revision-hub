type Catalog = {
  subjects: Array<{ id: string; lessons: Array<{ id: string }> }>
}

export type NavigationState = {
  subjectId: string
  topicId: string
}

export function readNavigation(search: string, catalog: Catalog): NavigationState {
  const firstSubject = catalog.subjects[0]
  if (!firstSubject?.lessons[0]) throw new Error("Content catalog requires a lesson")

  const params = new URLSearchParams(search)
  const subject = catalog.subjects.find((entry) => entry.id === params.get("subject")) ?? firstSubject
  const topic = subject.lessons.find((entry) => entry.id === params.get("topic")) ?? subject.lessons[0]

  return { subjectId: subject.id, topicId: topic.id }
}

export function writeNavigation(state: NavigationState): string {
  return `?${new URLSearchParams({ subject: state.subjectId, topic: state.topicId })}`
}
