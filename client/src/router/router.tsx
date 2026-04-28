import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom'

import App from '~/App'
import Auth from '~/pages/auth/Auth'
import AuthLogin from '~/pages/auth/auth-login/AuthLogin'
import AuthSignup from '~/pages/auth/auth-signup/AuthSignup'
import MainContainer from '~/pages/main-container/MainContainer'
import Projects from '~/pages/projects/Projects'
import Sprints from '~/pages/sprints/Sprints'
import Board from '~/pages/board/Board'
import TaskDetail from '~/pages/board/TaskDetail'
import MyTasks from '~/pages/my-tasks/MyTasks'
import Admin from '~/pages/admin/Admin'
import Profile from '~/pages/profile/Profile'
import Releases from '~/pages/releases/Releases'
import ReleaseDetail from '~/pages/releases/ReleaseDetail'
import Analytics from '~/pages/analytics/Analytics'

import { authCheck, guestOnly, roleCheck } from './loaders/authCheck'

export const routerConfig = (
  <Route element={<App />}>
    <Route element={<MainContainer />} loader={authCheck}>
      <Route index element={<Navigate to="projects" replace />} />
      <Route path="projects" element={<Projects />} />
      <Route path="sprints" element={<Sprints />} />
      <Route path="board" element={<Board />} />
      <Route path="board/:taskId" element={<TaskDetail />} />
      <Route path="my-tasks" element={<MyTasks />} />
      <Route path="releases" element={<Releases />} />
      <Route path="releases/:releaseId" element={<ReleaseDetail />} />
      <Route
        path="analytics"
        element={<Analytics />}
        loader={roleCheck('Admin', 'Project Manager')}
      />
      <Route path="admin" element={<Admin />} />
      <Route path="profile" element={<Profile />} />
    </Route>
    <Route path="auth" element={<Auth />} loader={guestOnly}>
      <Route index element={<Navigate to="login" replace />} />
      <Route path="login" element={<AuthLogin />} />
      <Route path="signup" element={<AuthSignup />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
)

export const router = createBrowserRouter(
  createRoutesFromElements(routerConfig),
)
