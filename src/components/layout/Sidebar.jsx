import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Home,
    Scale,
    DollarSign,
    Fish,
    Info,
    Map as MapIcon,
    Menu,
    Sun,
    Moon,
    Github,
} from 'lucide-react';
import { LANDING_SITES } from '../../constants/landingSites';
import { getVersionString } from '../../utils/version';

const CURRENCY_SYMBOLS = {
    MZN: 'MZN',
    USD: 'USD',
};

const SidebarContent = ({
    className,
    selectedLandingSite,
    setSelectedLandingSite,
    currency,
    setCurrency,
    theme,
    toggleTheme,
    setOpen
}) => {
    const location = useLocation();
    const isRevenuePage = location.pathname === '/revenue';
    const shouldShowLandingSiteSelector = ['/catch', '/revenue'].includes(location.pathname);

    const formatLandingSiteName = (site) => {
        return site === 'all'
            ? 'All Districts'
            : site.charAt(0).toUpperCase() + site.slice(1).replace('_', ' ');
    };

    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/catch', icon: Scale, label: 'Catch' },
        { to: '/revenue', icon: DollarSign, label: 'Revenue' },
        { to: '/Composition', icon: Fish, label: 'Composition' },
        { to: '/about', icon: Info, label: 'About' },
    ];

    return (
        <div className={cn("pb-12 h-full flex flex-col", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary flex items-center gap-2">
                        <Fish className="h-6 w-6" />
                        PESKAS
                    </h2>
                    <p className="px-4 text-xs text-muted-foreground mb-6">
                        Cabo Delgado 🇲🇿 ({getVersionString()})
                    </p>
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.to}
                                variant={location.pathname === item.to ? "secondary" : "ghost"}
                                className={cn("w-full justify-start", location.pathname === item.to && "bg-secondary/50 font-bold")}
                                asChild
                                onClick={() => setOpen?.(false)}
                            >
                                <Link to={item.to}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>

                {(shouldShowLandingSiteSelector || isRevenuePage) && (
                    <div className="px-3 py-2">
                        <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                            <h3 className="mb-2 px-0 text-sm font-semibold tracking-tight text-muted-foreground">
                                Filters
                            </h3>

                            {shouldShowLandingSiteSelector && (
                                <div className="space-y-2 mb-4">
                                    <label className="text-xs font-medium">District</label>
                                    <Select
                                        value={selectedLandingSite}
                                        onValueChange={setSelectedLandingSite}
                                    >
                                        <SelectTrigger className="w-full bg-background">
                                            <SelectValue placeholder="Select District">
                                                {formatLandingSiteName(selectedLandingSite)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Districts</SelectItem>
                                            {LANDING_SITES.map((site) => (
                                                <SelectItem key={site} value={site}>
                                                    {formatLandingSiteName(site)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {isRevenuePage && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Currency</label>
                                    <div className="flex gap-2">
                                        {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                                            <Button
                                                key={curr}
                                                variant={currency === curr ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrency(curr)}
                                                className="flex-1"
                                            >
                                                {curr}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto px-3 py-4">
                <div className="flex items-center justify-between px-4 py-2 bg-muted/10 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="View Code">
                        <a href="https://github.com/WorldFishCenter/peskas.zanzibar.portal" target="_blank" rel="noreferrer">
                            <Github className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const Sidebar = (props) => {
    return (
        <div className="hidden border-r bg-card md:block w-64 fixed h-screen overflow-y-auto">
            <SidebarContent {...props} />
        </div>
    );
};

export const MobileNav = (props) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <SidebarContent {...props} setOpen={setOpen} />
            </SheetContent>
        </Sheet>
    );
};
