import { createRouter, createWebHashHistory } from 'vue-router';
import Lab from './Lab.vue';
import Lesson from './Lesson.vue';

export const sections = [
  { name: 'lab', path: '/', title: 'Application lab' },
  { name: 'learn', path: '/learn', title: 'What you will learn' },
  { name: 'setup', path: '/setup', title: 'How to run' },
  { name: 'architecture', path: '/architecture', title: 'Architecture & workflow' },
  { name: 'walkthrough', path: '/walkthrough', title: 'Code walkthrough' },
];
export function makeRouter(history = createWebHashHistory()) {
  return createRouter({ history, routes: [
    ...sections.map(section => ({ path: section.path, name: section.name, component: section.name === 'lab' ? Lab : Lesson, props: section.name === 'lab' ? false : { section: section.name } })),
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ] });
}
