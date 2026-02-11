import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/login';
import './App.css';
import { Dashboard } from './pages/dashboard';
import { AuthProvider } from './context/AuthContext';
import { Projects } from './pages/projects';
import { Teams } from './pages/teams';
import { Tasks } from './pages/tasks';
import { Permissions } from './pages/permissions';
import { Users } from './pages/users';
import { Workers } from './pages/workers';
import { BOQ } from './pages/boq';
import { MaterialRequests } from './pages/material-requests';
import { FileManager } from './pages/file-manager';
import { PurchaseOrders } from './pages/purchase-orders';
import { GRN } from './pages/grn';
import {Vendors} from './pages/vendors';
import { Inventory } from './pages/inventory';
// import { TodoList } from './pages/todolist/index.tsx';
// import { Instagram } from './pages/instagram/index.tsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/users" element={<Users />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/roles-permissions" element={<Permissions />} />
          <Route path="/boq" element={<BOQ />} />
          <Route path="/material-requests" element={<MaterialRequests />} />
          <Route path="/file-manager" element={<FileManager />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/grn" element={<GRN />} />
          <Route path="/inventory" element={<Inventory />} />
          {/* <Route path="/list" element={<TodoList />} /> */}
          {/* <Route path="/instagram" element={<Instagram />} /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
