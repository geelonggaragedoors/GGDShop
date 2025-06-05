import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import TrackOrder from "@/pages/track-order";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import AdminLayout from "@/pages/admin/layout";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Handle admin routes - redirect to login if not authenticated
  const AdminRoute = ({ component: Component }: { component: React.ComponentType }) => {
    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!isAuthenticated) {
      // Redirect to login for admin routes
      window.location.href = '/api/login';
      return null;
    }
    
    return <Component />;
  };

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/products/:categorySlug?" component={Products} />
      <Route path="/admin" component={() => <AdminRoute component={AdminLayout} />} />
      <Route path="/admin/:path*" component={() => <AdminRoute component={AdminLayout} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster />
            <Router />
          </WishlistProvider>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
