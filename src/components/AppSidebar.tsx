
import { 
  Sidebar, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Home, Users, Package, ShoppingCart, Wrench, ClipboardList, DollarSign, Calendar, Database, Settings, Tablet, LogOut, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Only show admin section if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center px-4 py-2">
              <SidebarHeader className="flex items-center px-4 py-4">
                  <div className="flex items-center space-x-2">
                      <img
                          src="/LogoBanner1.png"
                          alt="Gestor Pro Logo"
                          className="h-20 w-auto" // Adjusted size for sidebar
                      />
                      <span className="sr-only">Gestor Pro</span>
                  </div>
              </SidebarHeader>
        <h1 className="text-lg font-semibold text-blue-600">Gestor Pro</h1>
      </SidebarHeader>
      <SidebarContent>
        <div className="mb-2 mt-2 px-4 text-xs font-semibold uppercase text-muted-foreground">
          Menu Principal
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/") ? "bg-blue-100" : ""}>
              <Link to="/" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/clientes") ? "bg-blue-100" : ""}>
              <Link to="/clientes" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>Clientes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/equipamentos") ? "bg-blue-100" : ""}>
              <Link to="/equipamentos" className="flex items-center">
                <Tablet className="mr-2 h-4 w-4" />
                <span>Equipamentos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/materiais") ? "bg-blue-100" : ""}>
              <Link to="/materiais" className="flex items-center">
                <Package className="mr-2 h-4 w-4" />
                <span>Materiais</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/encomendas") ? "bg-blue-100" : ""}>
              <Link to="/encomendas" className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>Encomendas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/tecnicos") ? "bg-blue-100" : ""}>
              <Link to="/tecnicos" className="flex items-center">
                <Wrench className="mr-2 h-4 w-4" />
                <span>Técnicos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/servicos") ? "bg-blue-100" : ""}>
              <Link to="/servicos" className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>Serviços</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/financeiro") ? "bg-blue-100" : ""}>
              <Link to="/financeiro" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Financeiro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/vencimentos") ? "bg-blue-100" : ""}>
              <Link to="/vencimentos" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Vencimentos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/agenda") ? "bg-blue-100" : ""}>
              <Link to="/agenda" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Agenda</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/ferramentas") ? "bg-blue-100" : ""}>
              <Link to="/ferramentas" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Ferramentas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className={isActive("/backup") ? "bg-blue-100" : ""}>
              <Link to="/backup" className="flex items-center">
                <Database className="mr-2 h-4 w-4" />
                <span>Backup</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Admin section - only visible for admin users */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase text-muted-foreground">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className={isActive("/admin/usuarios") ? "bg-blue-100" : ""}>
                    <Link to="/admin/usuarios" className="flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {/* Logout button at bottom of sidebar */}
        <div className="mt-auto mb-4 px-4">
          <SidebarMenuButton 
            asChild 
            className="w-full justify-start text-red-600 hover:bg-red-50"
            onClick={logout}
          >
            <button className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </button>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
