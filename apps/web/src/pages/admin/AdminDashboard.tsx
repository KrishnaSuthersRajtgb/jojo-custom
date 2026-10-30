import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  CheckCircle2,
  Search,
  AlertTriangle,
  LayoutDashboard,
  Scissors,
  Sparkles,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Film,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  ArrowRight,
  Users,
  Star,
  FileText,
  Download,
  Tag,
  Truck,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Megaphone,
  Upload,
  Layers,
  Edit2,
  Check,
} from 'lucide-react';

import {
  BANNER_STORAGE_KEY,
  DEFAULT_BANNER,
  type BannerConfig,
} from '../../components/SitePopupBanner';
import { garmentStyleService, type GarmentItem } from '../../services/garmentStyleService';

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Address } from '../../context/AddressContext';
import {
  orderApi,
  cronApi,
  userApi,
  reviewApi,
  type CronStatusData,
  type CronRunStats,
  type RegisteredUser,
  type ReviewItem,
} from '../../services';
import AmazonInvoiceModal from '../../components/AmazonInvoiceModal';
import AtelierJobCardModal from '../../components/AtelierJobCardModal';
import { couponService, type AtelierCoupon } from '../../services/couponService';
import {
  pricingService,
  type AccessoryItem,
  type CustomFabricPayload,
} from '../../services/pricingService';
import { type Fabric } from '../../data/fabrics';

const serif = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

interface SelectionEntry {
  sectionLabel: string;
  optionLabel: string | null;
  subOptionLabel: string | null;
}

interface AccessoryEntry {
  id: string;
  label: string;
  price: number;
}

interface ReferenceImage {
  dataUrl: string;
  fileName: string;
}

interface OrderDetails {
  fabricId: string;
  fabricName: string;
  tone: string;
  garment: string;
  garmentLabel?: string;
  meters: number;
  pricePerMeter: number;
  total: number;
  isCustom?: boolean;
  fabricTotal?: number;
  productId?: string;
  productName?: string;
  selections?: SelectionEntry[] | null;
  accessories?: AccessoryEntry[];
  accessoriesTotal?: number;
  measurementValues?: Record<string, string> | null;
  bodyType?: string | null;
  referenceImage?: ReferenceImage | null;
}

type OrderStatus = 'placed' | 'packed' | 'dispatched' | 'delivered';

const ORDER_STATUS_STEPS: { value: OrderStatus; label: string }[] = [
  { value: 'placed', label: 'Order Placed' },
  { value: 'packed', label: 'Packed & Ready' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
];

interface SavedOrder {
  id: string;
  orderDetails: OrderDetails;
  address: Address;
  paymentId: string | null;
  placedAt: string;
  status?: OrderStatus | undefined;
  paymentStatus?: 'paid' | 'pending' | 'failed' | undefined;
  trackingNumber?: string | undefined;
  courier?: string | undefined;
}

interface AdminOrderRow extends SavedOrder {
  username: string;
}

const BODY_TYPE_LABELS: Record<string, string> = {
  invertedTriangle: 'The Inverted Triangle',
  column: 'The Column',
  rectangle: 'The Rectangle',
  apple: 'The Apple',
  pear: 'The Pear',
  hourglass: 'The Hour Glass',
};

const ORDERS_KEY_PREFIX = 'jojo_orders_';

type AdminTab =
  | 'dashboard'
  | 'fabrics'
  | 'accessories'
  | 'garments'
  | 'orders'
  | 'coupons'
  | 'roles'
  | 'failedPayments'
  | 'visuals'
  | 'users'
  | 'reviews'
  | 'banner';

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isSavedOrder(value: unknown): value is SavedOrder {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.placedAt !== 'string') return false;
  if (typeof v.orderDetails !== 'object' || v.orderDetails === null) return false;
  if (typeof v.address !== 'object' || v.address === null) return false;
  return true;
}

function loadAllLocalOrders(): AdminOrderRow[] {
  const rows: AdminOrderRow[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(ORDERS_KEY_PREFIX)) continue;
    const username = key.slice(ORDERS_KEY_PREFIX.length);
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      parsed.filter(isSavedOrder).forEach((o) => {
        rows.push({ ...o, username });
      });
    } catch {
      // ignore
    }
  }
  return rows;
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const isStaff = currentUser?.role === 'staff';
  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Guard: Staff members only have operational access to 5 designated tabs
  useEffect(() => {
    if (
      isStaff &&
      !['dashboard', 'fabrics', 'accessories', 'garments', 'orders', 'coupons', 'banner'].includes(
        activeTab,
      )
    ) {
      setActiveTab('dashboard');
    }
  }, [isStaff, activeTab]);

  // ── Promo Popup Banner State ───────────────────────────────────────────
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(() => {
    try {
      const raw = localStorage.getItem(BANNER_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as BannerConfig;
    } catch {
      // ignore
    }
    return DEFAULT_BANNER;
  });

  const handleSaveBanner = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(bannerConfig));
    window.dispatchEvent(new Event('jojo_banner_updated'));
    showToast('Promotion popup banner saved and published live on user storefront!');
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBannerConfig((prev) => ({ ...prev, imageUrl: reader.result as string }));
        showToast('Image uploaded and set as popup banner!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetBanner = () => {
    setBannerConfig(DEFAULT_BANNER);
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(DEFAULT_BANNER));
    window.dispatchEvent(new Event('jojo_banner_updated'));
    showToast('Banner reset to default atelier announcement.');
  };

  // ── All Fabrics with Dynamic Additions ──────────────────────────────────
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]);
  const [fabricSearch, setFabricSearch] = useState('');
  const [fabricMaterialFilter, setFabricMaterialFilter] = useState('all');
  const [fabricToneFilter, setFabricToneFilter] = useState('all');
  const [customFabricPrices, setCustomFabricPrices] = useState<Record<string, number>>({});
  const [editingPriceMap, setEditingPriceMap] = useState<Record<string, string>>({});
  const [bulkPercent, setBulkPercent] = useState<string>('10');
  const [savingFabricId, setSavingFabricId] = useState<string | null>(null);

  // Pagination for fabrics
  const [fabricPage, setFabricPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(30);

  // Add New Fabric Modal
  const [showAddFabricModal, setShowAddFabricModal] = useState(false);
  const [newFabricName, setNewFabricName] = useState('');
  const [newFabricTone, setNewFabricTone] = useState<'warm' | 'cool' | 'neutral'>('warm');
  const [newFabricHex, setNewFabricHex] = useState('#7A1F2B');
  const [newFabricMaterial, setNewFabricMaterial] = useState('Raw Silk');
  const [newFabricPrice, setNewFabricPrice] = useState('');
  const [newFabricDesc, setNewFabricDesc] = useState('');
  const [addingFabric, setAddingFabric] = useState(false);

  // ── Accessories Pricing State ───────────────────────────────────────────
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [editingAccPriceMap, setEditingAccPriceMap] = useState<Record<string, string>>({});
  const [newAccName, setNewAccName] = useState('');
  const [newAccPrice, setNewAccPrice] = useState('');
  const [newAccDesc, setNewAccDesc] = useState('');
  const [newAccCat, setNewAccCat] = useState('embellishment');
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [savingAccessories, setSavingAccessories] = useState(false);

  // ── Failed Payment Cron State ───────────────────────────────────────────
  const [cronStatus, setCronStatus] = useState<CronStatusData | null>(null);
  const [cronRunning, setCronRunning] = useState(false);
  const [lastCronResult, setLastCronResult] = useState<CronRunStats | null>(null);

  // ── Expanded Order Modal / Drawer ───────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRow | null>(null);

  // ── Registered Users State ──────────────────────────────────────────────
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // ── Customer Reviews State ──────────────────────────────────────────────
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // ── Amazon Invoice State ────────────────────────────────────────────────
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<AdminOrderRow | null>(null);

  // ── Master Tailor Production Job Card ───────────────────────────────────
  const [showJobCardModal, setShowJobCardModal] = useState(false);
  const [jobCardOrder, setJobCardOrder] = useState<AdminOrderRow | null>(null);

  // ── BlueDart Courier AWB Editing ────────────────────────────────────────
  const [editingAwbOrderId, setEditingAwbOrderId] = useState<string | null>(null);
  const [awbInput, setAwbInput] = useState<string>('');
  const [savingAwb, setSavingAwb] = useState(false);

  // ── Atelier Coupons & Discounts ─────────────────────────────────────────
  const [coupons, setCoupons] = useState<AtelierCoupon[]>([]);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'flat'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('15');
  const [newCouponMin, setNewCouponMin] = useState('1500');
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // ── Garment Items & Sub-Divisions Catalog State ──────────────────────────
  const [garmentsList, setGarmentsList] = useState<GarmentItem[]>(() =>
    garmentStyleService.getGarments(),
  );
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(() => {
    const list = garmentStyleService.getGarments();
    return list[0]?.id ?? 'blouse';
  });

  const selectedGarment = useMemo(
    () => garmentsList.find((g) => g.id === selectedGarmentId) ?? garmentsList[0],
    [garmentsList, selectedGarmentId],
  );

  // Add Item Modal
  const [showAddGarmentModal, setShowAddGarmentModal] = useState(false);
  const [newGarmentName, setNewGarmentName] = useState('');
  const [newGarmentMeters, setNewGarmentMeters] = useState('2.5');
  const [newGarmentBaseTailoring, setNewGarmentBaseTailoring] = useState('500');
  const [newGarmentDesc, setNewGarmentDesc] = useState('');
  const [newGarmentProfile, setNewGarmentProfile] = useState<'blouse' | 'chudi' | 'pant'>('blouse');

  // Edit Item Modal
  const [editingGarment, setEditingGarment] = useState<GarmentItem | null>(null);
  const [editGarmentName, setEditGarmentName] = useState('');
  const [editGarmentMeters, setEditGarmentMeters] = useState('');
  const [editGarmentBaseTailoring, setEditGarmentBaseTailoring] = useState('');

  // Add Section Modal
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');

  // Add Option Modal
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [targetSectionIdForOption, setTargetSectionIdForOption] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionTailoringPrice, setNewOptionTailoringPrice] = useState('250');

  // Add Sub-Option Modal
  const [showAddSubOptionModal, setShowAddSubOptionModal] = useState(false);
  const [targetSectionIdForSub, setTargetSectionIdForSub] = useState('');
  const [targetOptionIdForSub, setTargetOptionIdForSub] = useState('');
  const [newSubOptionLabel, setNewSubOptionLabel] = useState('');
  const [newSubOptionTailoringPrice, setNewSubOptionTailoringPrice] = useState('150');

  // Inline option editing
  const [editingTailoringPrices, setEditingTailoringPrices] = useState<Record<string, string>>({});

  // ── Staff & Role-Based Access State (Admin & Staff only) ────────────────
  const [roleEmailInput, setRoleEmailInput] = useState('');
  const [roleSelectValue, setRoleSelectValue] = useState<'admin' | 'staff'>('staff');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all');
  const [assigningRole, setAssigningRole] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const refreshOrders = async () => {
    setLoadingOrders(true);
    const local = loadAllLocalOrders();

    try {
      const res = await orderApi.getAll();
      const mappedApi: AdminOrderRow[] = res.data.map((item) => ({
        id: item.id,
        username: item.username,
        orderDetails: item.orderDetails as unknown as OrderDetails,
        address: item.address as unknown as Address,
        paymentId: item.paymentId,
        placedAt: item.placedAt,
        status: (item.status || 'placed') as OrderStatus,
        paymentStatus: item.paymentStatus as 'paid' | 'pending' | 'failed',
        trackingNumber: item.trackingNumber,
        courier: item.courier,
      }));

      const mergedMap = new Map<string, AdminOrderRow>();
      local.forEach((o) => mergedMap.set(o.id, o));
      mappedApi.forEach((o) => mergedMap.set(o.id, o));
      setOrders(Array.from(mergedMap.values()).sort((a, b) => (a.placedAt > b.placedAt ? -1 : 1)));
    } catch {
      setOrders(local);
    } finally {
      setLoadingOrders(false);
    }
  };

  const refreshPricing = () => {
    const list = pricingService.getAllFabrics();
    setAllFabrics(list);
    const prices = pricingService.getAllFabricPrices();
    setCustomFabricPrices(prices);
    const accs = pricingService.getAccessories();
    setAccessories(accs);

    const initialAccMap: Record<string, string> = {};
    accs.forEach((a) => {
      initialAccMap[a.id] = String(a.price);
    });
    setEditingAccPriceMap(initialAccMap);
  };

  const refreshCron = async () => {
    try {
      const res = await cronApi.getStatus();
      setCronStatus(res.data);
    } catch {
      // offline fallback
    }
  };

  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await userApi.getAll();
      setRegisteredUsers(res.data);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await reviewApi.getAdminReviews();
      setReviews(res.data);
    } catch (e) {
      console.warn('Failed to load reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    void refreshOrders();
    refreshPricing();
    void refreshCron();
    void refreshUsers();
    void refreshReviews();
    setCoupons(couponService.getCoupons());

    const interval = setInterval(() => {
      void refreshCron();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // ── Metrics Calculation ─────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid' || Boolean(o.paymentId));
    const failedOrders = orders.filter((o) => o.paymentStatus === 'failed');
    const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending' && !o.paymentId);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.orderDetails.total || 0), 0);
    const activeCustomizations = orders.filter((o) => o.status !== 'delivered').length;

    return {
      totalCount,
      paidCount: paidOrders.length,
      failedCount: failedOrders.length,
      pendingCount: pendingOrders.length,
      totalRevenue,
      activeCustomizations,
    };
  }, [orders]);

  // ── Filtered & Paginated Fabrics ────────────────────────────────────────
  const materialsList = useMemo(() => {
    const set = new Set<string>();
    allFabrics.forEach((f) => {
      if (f.material) set.add(f.material);
    });
    return Array.from(set).sort();
  }, [allFabrics]);

  const filteredFabrics = useMemo(() => {
    return allFabrics.filter((fabric) => {
      const matchesSearch =
        fabricSearch === '' ||
        fabric.name.toLowerCase().includes(fabricSearch.toLowerCase()) ||
        fabric.id.toLowerCase().includes(fabricSearch.toLowerCase()) ||
        (fabric.material && fabric.material.toLowerCase().includes(fabricSearch.toLowerCase()));

      const matchesMaterial =
        fabricMaterialFilter === 'all' || fabric.material === fabricMaterialFilter;

      const matchesTone = fabricToneFilter === 'all' || fabric.tone === fabricToneFilter;

      return matchesSearch && matchesMaterial && matchesTone;
    });
  }, [allFabrics, fabricSearch, fabricMaterialFilter, fabricToneFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFabrics.length / pageSize));
  const paginatedFabrics = useMemo(() => {
    const start = (fabricPage - 1) * pageSize;
    return filteredFabrics.slice(start, start + pageSize);
  }, [filteredFabrics, fabricPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setFabricPage(1);
  }, [fabricSearch, fabricMaterialFilter, fabricToneFilter, pageSize]);

  // ── Save Fabric Price ───────────────────────────────────────────────────
  const handleSaveFabricPrice = async (fabricId: string, currentCatalogPrice: number) => {
    const entered = editingPriceMap[fabricId];
    const newPrice = entered ? parseFloat(entered) : currentCatalogPrice;

    if (isNaN(newPrice) || newPrice < 0) {
      showToast('Please enter a valid price in rupees.');
      return;
    }

    setSavingFabricId(fabricId);
    try {
      await pricingService.saveFabricPrice(fabricId, newPrice);
      setCustomFabricPrices((prev) => ({ ...prev, [fabricId]: newPrice }));
      showToast(`Updated price for ${fabricId} to ₹${newPrice}/m. Synced with storefront!`);
    } catch {
      showToast('Error saving fabric price.');
    } finally {
      setSavingFabricId(null);
    }
  };

  // ── Bulk Adjust Fabric Prices ───────────────────────────────────────────
  const handleBulkAdjustFabrics = async (multiplier: number) => {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct) || pct <= 0) {
      showToast('Please enter a valid percentage.');
      return;
    }

    const factor = 1 + (multiplier * pct) / 100;
    const bulkMap: Record<string, number> = {};

    filteredFabrics.forEach((f) => {
      const current = customFabricPrices[f.id] ?? f.pricePerMeter;
      bulkMap[f.id] = Math.round(current * factor);
    });

    try {
      await pricingService.saveBulkFabricPrices(bulkMap);
      setCustomFabricPrices((prev) => ({ ...prev, ...bulkMap }));
      showToast(
        `Applied ${multiplier > 0 ? '+' : '-'}${pct}% across ${filteredFabrics.length} fabrics!`,
      );
    } catch {
      showToast('Error adjusting bulk prices.');
    }
  };

  // ── Add New Fabric SKU ──────────────────────────────────────────────────
  const handleAddNewFabric = async () => {
    if (!newFabricName.trim() || !newFabricPrice.trim()) {
      showToast('Please enter fabric name and price.');
      return;
    }

    const price = parseFloat(newFabricPrice);
    if (isNaN(price) || price <= 0) {
      showToast('Please enter a valid price.');
      return;
    }

    setAddingFabric(true);
    try {
      const payload: CustomFabricPayload = {
        name: newFabricName.trim(),
        tone: newFabricTone,
        hex: newFabricHex,
        material: newFabricMaterial.trim(),
        pricePerMeter: Math.round(price),
        description: newFabricDesc.trim() || 'Custom bespoke artisan weave.',
        width: '44 Inches',
        care: 'Dry Clean Only',
      };

      await pricingService.addCustomFabric(payload);
      refreshPricing();
      setShowAddFabricModal(false);
      setNewFabricName('');
      setNewFabricPrice('');
      setNewFabricDesc('');
      showToast(`New fabric "${payload.name}" added and available in user storefront!`);
    } catch {
      showToast('Error adding new fabric.');
    } finally {
      setAddingFabric(false);
    }
  };

  // ── Save Accessories ────────────────────────────────────────────────────
  const handleSaveAccessories = async () => {
    setSavingAccessories(true);
    try {
      const updated: AccessoryItem[] = accessories.map((acc) => {
        const raw = editingAccPriceMap[acc.id];
        const p = raw !== undefined ? parseFloat(raw) : acc.price;
        return {
          ...acc,
          price: isNaN(p) || p < 0 ? acc.price : Math.round(p),
        };
      });

      await pricingService.saveAccessories(updated);
      setAccessories(updated);
      showToast('All accessory amounts saved and synced with user customizer!');
    } catch {
      showToast('Failed to save accessory prices.');
    } finally {
      setSavingAccessories(false);
    }
  };

  const handleToggleAccessory = async (id: string) => {
    const updated = accessories.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    await pricingService.saveAccessories(updated);
    setAccessories(updated);
    showToast('Accessory status updated!');
  };

  const handleAddNewAccessory = async () => {
    if (!newAccName.trim() || !newAccPrice.trim()) {
      showToast('Please provide both name and price.');
      return;
    }

    const price = parseFloat(newAccPrice);
    if (isNaN(price) || price < 0) {
      showToast('Please enter a valid price.');
      return;
    }

    const id = newAccName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const newItem: AccessoryItem = {
      id,
      label: newAccName.trim(),
      price: Math.round(price),
      active: true,
      category: newAccCat || 'embellishment',
      description: newAccDesc.trim() || 'Custom embellishment option',
    };

    const updated = [...accessories, newItem];
    await pricingService.saveAccessories(updated);
    setAccessories(updated);
    setEditingAccPriceMap((prev) => ({ ...prev, [id]: String(price) }));
    setNewAccName('');
    setNewAccPrice('');
    setNewAccDesc('');
    setShowAddAccModal(false);
    showToast(`Added new accessory "${newItem.label}"!`);
  };

  const handleDeleteAccessory = async (id: string) => {
    const updated = accessories.filter((a) => a.id !== id);
    await pricingService.saveAccessories(updated);
    setAccessories(updated);
    showToast('Accessory removed.');
  };

  // ── Trigger Failed Payments Cron ────────────────────────────────────────
  const handleTriggerCron = async () => {
    setCronRunning(true);
    try {
      const res = await cronApi.runJob();
      setLastCronResult(res.data);
      showToast(res.data.message || 'Failed payments cron job completed successfully!');
      await refreshCron();
      await refreshOrders();
    } catch (e) {
      showToast('Cron execution failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setCronRunning(false);
    }
  };

  // ── Update Order Status Workflow ────────────────────────────────────────
  const handleUpdateOrderStatus = async (
    orderId: string,
    username: string,
    status: OrderStatus,
    trackingNumber?: string,
  ) => {
    try {
      await orderApi.updateStatus(orderId, status, trackingNumber, 'BlueDart Express');
      const key = ORDERS_KEY_PREFIX + username;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: SavedOrder[] = JSON.parse(raw) as SavedOrder[];
        const updated = parsed.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                ...(trackingNumber !== undefined ? { trackingNumber } : {}),
                courier: 'BlueDart Express',
              }
            : o,
        );
        localStorage.setItem(key, JSON.stringify(updated));
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                ...(trackingNumber !== undefined ? { trackingNumber } : {}),
                courier: 'BlueDart Express',
              }
            : o,
        ),
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status,
                ...(trackingNumber !== undefined ? { trackingNumber } : {}),
                courier: 'BlueDart Express',
              }
            : null,
        );
      }
      showToast(`Order status updated to "${status}"`);
    } catch {
      showToast('Failed to update order status');
    }
  };

  // ── Save BlueDart Courier AWB Tracking Number ───────────────────────────
  const handleSaveAwb = async (orderId: string, username: string, currentStatus?: OrderStatus) => {
    if (!awbInput.trim()) {
      showToast('Please enter an Airway Bill (AWB) tracking number.');
      return;
    }
    setSavingAwb(true);
    const trackingNumber = awbInput.trim().toUpperCase();
    try {
      await orderApi.updateStatus(orderId, currentStatus, trackingNumber, 'BlueDart Express');
      const key = ORDERS_KEY_PREFIX + username;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: SavedOrder[] = JSON.parse(raw) as SavedOrder[];
        const updated = parsed.map((o) =>
          o.id === orderId ? { ...o, trackingNumber, courier: 'BlueDart Express' } : o,
        );
        localStorage.setItem(key, JSON.stringify(updated));
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, trackingNumber, courier: 'BlueDart Express' } : o,
        ),
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, trackingNumber, courier: 'BlueDart Express' } : null,
        );
      }
      setEditingAwbOrderId(null);
      setAwbInput('');
      showToast(`Assigned BlueDart AWB #${trackingNumber} to order! Synced with user tracking.`);
    } catch {
      showToast('Failed to update AWB tracking number.');
    } finally {
      setSavingAwb(false);
    }
  };

  // ── 1-Click Export Orders to CSV ─────────────────────────────────────────
  const handleExportOrdersCsv = () => {
    const list = orders.filter((o) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'paid') return o.paymentStatus === 'paid' || Boolean(o.paymentId);
      if (statusFilter === 'failed') return o.paymentStatus === 'failed';
      return o.paymentStatus === 'pending' && !o.paymentId;
    });

    if (list.length === 0) {
      showToast('No orders available to export.');
      return;
    }

    const headers = [
      'Order ID',
      'Placed At',
      'Client Username',
      'Client Name',
      'Phone',
      'City',
      'State',
      'Pincode',
      'Garment',
      'Fabric Name',
      'Meters',
      'Total (INR)',
      'Payment Status',
      'Payment ID',
      'Order Stage',
      'AWB Tracking Number',
      'Courier Partner',
    ];

    const escapeCsv = (val: string | number | boolean | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map((o) => [
      escapeCsv(o.id),
      escapeCsv(o.placedAt),
      escapeCsv(o.username),
      escapeCsv(o.address.fullName),
      escapeCsv(o.address.phone),
      escapeCsv(o.address.city),
      escapeCsv(o.address.state),
      escapeCsv(o.address.pincode),
      escapeCsv(o.orderDetails.garment),
      escapeCsv(o.orderDetails.fabricName),
      escapeCsv(o.orderDetails.meters),
      escapeCsv(o.orderDetails.total),
      escapeCsv(o.paymentStatus ?? (o.paymentId ? 'paid' : 'pending')),
      escapeCsv(o.paymentId ?? ''),
      escapeCsv(o.status ?? 'placed'),
      escapeCsv(o.trackingNumber ?? ''),
      escapeCsv(o.courier ?? 'BlueDart Express'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jojo-atelier-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${list.length} orders to CSV successfully!`);
  };

  // ── Coupons Management Handlers ──────────────────────────────────────────
  const handleCreateCoupon = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) {
      showToast('Please provide a coupon code (e.g. BRIDAL15).');
      return;
    }
    const val = parseFloat(newCouponValue);
    const minVal = parseFloat(newCouponMin);
    if (isNaN(val) || val <= 0) {
      showToast('Please enter a valid discount value.');
      return;
    }
    const newCoupon: AtelierCoupon = {
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: val,
      minOrderValue: isNaN(minVal) ? 0 : minVal,
      description:
        newCouponDesc.trim() ||
        `${val.toString()}${newCouponType === 'percentage' ? '%' : '₹'} atelier privilege discount`,
      active: true,
      usesCount: 0,
    };
    couponService.addCoupon(newCoupon);
    setCoupons(couponService.getCoupons());
    setShowAddCouponModal(false);
    setNewCouponCode('');
    setNewCouponDesc('');
    showToast(`Created promo code "${newCoupon.code}"! Live at checkout.`);
  };

  const handleToggleCoupon = (code: string) => {
    const updated = couponService.toggleCoupon(code);
    setCoupons(updated);
    showToast(`Updated status for "${code}"`);
  };

  const handleDeleteCoupon = (code: string) => {
    const updated = couponService.deleteCoupon(code);
    setCoupons(updated);
    showToast(`Promo code "${code}" removed.`);
  };

  // ── Garment Items & Sub-Divisions Handlers ──────────────────────────────
  const refreshGarments = () => {
    setGarmentsList(garmentStyleService.getGarments());
  };

  const handleCreateGarment = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newGarmentName.trim()) {
      showToast('Please enter an item name (e.g. Kurti Set, Western Gown).');
      return;
    }
    const meters = parseFloat(newGarmentMeters);
    const baseTailoring = parseFloat(newGarmentBaseTailoring);
    if (isNaN(meters) || meters <= 0) {
      showToast('Please enter a valid default meterage.');
      return;
    }
    if (isNaN(baseTailoring) || baseTailoring < 0) {
      showToast('Please enter a valid base tailoring fee.');
      return;
    }

    const created = garmentStyleService.addGarment({
      label: newGarmentName.trim(),
      defaultMeters: meters,
      baseTailoringPrice: Math.round(baseTailoring),
      description:
        newGarmentDesc.trim() || 'Custom tailored ensemble handcrafted to precision measurements.',
      measurementProfile: newGarmentProfile,
      sections: [],
    });

    refreshGarments();
    setSelectedGarmentId(created.id);
    setShowAddGarmentModal(false);
    setNewGarmentName('');
    setNewGarmentDesc('');
    showToast(`Created new item "${created.label}"! Now visible on user styling & fabric pages.`);
  };

  const handleSaveGarmentEdits = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingGarment) return;
    const meters = parseFloat(editGarmentMeters);
    const baseTailoring = parseFloat(editGarmentBaseTailoring);
    if (!editGarmentName.trim() || isNaN(meters) || isNaN(baseTailoring)) {
      showToast('Please provide valid garment details.');
      return;
    }

    garmentStyleService.updateGarment(editingGarment.id, {
      label: editGarmentName.trim(),
      defaultMeters: meters,
      baseTailoringPrice: Math.round(baseTailoring),
    });

    refreshGarments();
    setEditingGarment(null);
    showToast(`Updated item "${editGarmentName.trim()}" successfully.`);
  };

  const handleDeleteGarment = (id: string, label: string) => {
    if (garmentsList.length <= 1) {
      showToast('Catalog must contain at least one item.');
      return;
    }
    garmentStyleService.deleteGarment(id);
    const updated = garmentStyleService.getGarments();
    setGarmentsList(updated);
    if (selectedGarmentId === id) {
      setSelectedGarmentId(updated[0]?.id ?? 'blouse');
    }
    showToast(`Item "${label}" removed from user pages.`);
  };

  const handleCreateSection = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGarment) return;
    if (!newSectionLabel.trim()) {
      showToast('Please enter a sub-division section name (e.g. Neckline Pattern, Sleeve Cut).');
      return;
    }

    const sectionId = newSectionLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    garmentStyleService.addSection(selectedGarment.id, {
      id: sectionId || `sec-${Date.now().toString().slice(-4)}`,
      label: newSectionLabel.trim(),
      options: [],
    });

    refreshGarments();
    setShowAddSectionModal(false);
    setNewSectionLabel('');
    showToast(
      `Added sub-division section "${newSectionLabel.trim()}" to ${selectedGarment.label}.`,
    );
  };

  const handleDeleteSection = (sectionId: string, sectionLabel: string) => {
    if (!selectedGarment) return;
    garmentStyleService.deleteSection(selectedGarment.id, sectionId);
    refreshGarments();
    showToast(`Deleted sub-division "${sectionLabel}".`);
  };

  const handleCreateOption = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGarment || !targetSectionIdForOption) return;
    if (!newOptionLabel.trim()) {
      showToast('Please enter a style option name (e.g. Princess Cut, Sweetheart Neck).');
      return;
    }
    const price = parseFloat(newOptionTailoringPrice);
    if (isNaN(price) || price < 0) {
      showToast('Please enter a valid tailoring amount (in INR).');
      return;
    }

    const optionId = newOptionLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    garmentStyleService.addOption(selectedGarment.id, targetSectionIdForOption, {
      id: optionId || `opt-${Date.now().toString().slice(-4)}`,
      label: newOptionLabel.trim(),
      tailoringPrice: Math.round(price),
      subOptions: [],
    });

    refreshGarments();
    setShowAddOptionModal(false);
    setNewOptionLabel('');
    showToast(
      `Added option "${newOptionLabel.trim()}" with tailoring amount ₹${Math.round(price)}.`,
    );
  };

  const handleUpdateOptionTailoringAmount = (
    sectionId: string,
    optionId: string,
    newPriceVal: number,
  ) => {
    if (!selectedGarment) return;
    garmentStyleService.updateOption(selectedGarment.id, sectionId, optionId, {
      tailoringPrice: newPriceVal,
    });
    refreshGarments();
    showToast(`Tailoring fee updated to ₹${newPriceVal}.`);
  };

  const handleDeleteOption = (sectionId: string, optionId: string, optionLabel: string) => {
    if (!selectedGarment) return;
    garmentStyleService.deleteOption(selectedGarment.id, sectionId, optionId);
    refreshGarments();
    showToast(`Deleted style option "${optionLabel}".`);
  };

  const handleCreateSubOption = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGarment || !targetSectionIdForSub || !targetOptionIdForSub) return;
    if (!newSubOptionLabel.trim()) {
      showToast('Please enter a sub-option name (e.g. 2 Dart, 3 Dart).');
      return;
    }
    const price = parseFloat(newSubOptionTailoringPrice);
    if (isNaN(price) || price < 0) {
      showToast('Please enter a valid tailoring fee.');
      return;
    }

    const subId = newSubOptionLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    garmentStyleService.addSubOption(
      selectedGarment.id,
      targetSectionIdForSub,
      targetOptionIdForSub,
      {
        id: subId || `sub-${Date.now().toString().slice(-4)}`,
        label: newSubOptionLabel.trim(),
        tailoringPrice: Math.round(price),
      },
    );

    refreshGarments();
    setShowAddSubOptionModal(false);
    setNewSubOptionLabel('');
    showToast(
      `Added sub-option "${newSubOptionLabel.trim()}" with tailoring amount ₹${Math.round(price)}.`,
    );
  };

  const handleDeleteSubOption = (
    sectionId: string,
    optionId: string,
    subOptionId: string,
    subLabel: string,
  ) => {
    if (!selectedGarment) return;
    garmentStyleService.deleteSubOption(selectedGarment.id, sectionId, optionId, subOptionId);
    refreshGarments();
    showToast(`Deleted sub-option "${subLabel}".`);
  };

  const handleResetGarmentsToFactory = () => {
    if (
      window.confirm(
        'Reset all garment items, sub-divisions, and tailoring pricing to factory defaults?',
      )
    ) {
      garmentStyleService.resetToDefaults();
      refreshGarments();
      showToast('Garment catalog reset to factory defaults.');
    }
  };

  // ── Role Assignment Handler (Admin & Staff Only) ──────────────────────────
  const handleAssignRole = async (
    e?: React.SubmitEvent,
    customEmail?: string,
    customRole?: 'admin' | 'staff',
  ) => {
    if (e) e.preventDefault();
    const targetEmail = (customEmail || roleEmailInput).trim().toLowerCase();
    const targetRole = customRole || roleSelectValue;

    if (!targetEmail) {
      showToast('Please enter a valid user email ID.');
      return;
    }

    setAssigningRole(true);
    try {
      const res = await userApi.updateRole({
        email: targetEmail,
        role: targetRole,
      });
      showToast(res.message || `Role for ${targetEmail} updated to "${targetRole}"!`);
      setRoleEmailInput('');
      await refreshUsers();
    } catch (err) {
      showToast('Error updating role: ' + (err instanceof Error ? err.message : 'User not found'));
    } finally {
      setAssigningRole(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#F8F5F0] text-[#1B1512] flex flex-col md:flex-row overflow-hidden">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B1512] text-[#FAF7F2] border border-[#B8935A]/50 px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 text-[#B8935A] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. COMPACT VERTICAL SIDEBAR (Clean & Space-Efficient)                */}
      {/* =================================================================== */}
      <aside className="w-full md:w-64 bg-[#1B1512] text-[#FAF7F2] border-r border-[#B8935A]/20 flex flex-col shrink-0 md:h-screen z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase font-semibold text-[#B8935A]">
              ATELIER PORTAL
            </div>
            <h2 className="text-xl font-normal text-[#FAF7F2] mt-0.5 tracking-tight" style={serif}>
              JoJo Boutique
            </h2>
          </div>
          <span
            className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
            title="System Online"
          />
        </div>

        {/* Vertical Nav Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-[#B8935A]" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('fabrics')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
              activeTab === 'fabrics'
                ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Scissors className="h-4 w-4 text-[#B8935A]" />
              <span>Fabric Pricing</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
              {allFabrics.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accessories')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
              activeTab === 'accessories'
                ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#B8935A]" />
              <span>Accessories</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
              {accessories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('garments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
              activeTab === 'garments'
                ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-[#B8935A]" />
              <span>Items &amp; Styling</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
              {garmentsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
              activeTab === 'orders'
                ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-[#B8935A]" />
              <span>Orders &amp; Data</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
              activeTab === 'coupons'
                ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-[#B8935A]" />
              <span>Coupons &amp; Promo</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
              {coupons.filter((c) => c.active).length}
            </span>
          </button>

          {/* Admin Master Governance Tabs (Hidden for Staff) */}
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
                  activeTab === 'users'
                    ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                    : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-[#B8935A]" />
                  <span>Registered Clients</span>
                </div>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
                  {registeredUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
                  activeTab === 'roles'
                    ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                    : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-[#B8935A]" />
                  <span>Staff &amp; Roles</span>
                </div>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
                  {registeredUsers.filter((u) => u.role === 'admin' || u.role === 'staff').length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                    : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-[#B8935A]" />
                  <span>Client Reviews</span>
                </div>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-[#E8DFC8]">
                  {reviews.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('failedPayments')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
                  activeTab === 'failedPayments'
                    ? 'bg-rose-900 text-[#FAF7F2] font-semibold shadow-xs'
                    : 'text-rose-300 hover:text-white hover:bg-rose-950/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Payment Cron</span>
                </div>
                {metrics.failedCount > 0 && (
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                    {metrics.failedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('visuals')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
                  activeTab === 'visuals'
                    ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                    : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
                }`}
              >
                <Film className="h-4 w-4 text-[#B8935A]" />
                <span>AI Reel &amp; Media</span>
              </button>

              <button
                onClick={() => setActiveTab('banner')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-medium tracking-wider uppercase transition-all ${
                  activeTab === 'banner'
                    ? 'bg-[#5C1A32] text-[#FAF7F2] font-semibold shadow-xs'
                    : 'text-[#A89F95] hover:text-[#FAF7F2] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone className="h-4 w-4 text-[#B8935A]" />
                  <span>Promotion Banner</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    bannerConfig.active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/10 text-[#E8DFC8]'
                  }`}
                >
                  {bannerConfig.active ? 'LIVE' : 'OFF'}
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer Quick Status */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-[#13100E]">
          <div className="flex items-center justify-between text-[11px] text-[#A89F95]">
            <span>Cron Auto-Reconcile:</span>
            <span className="text-emerald-400 font-semibold">Every 5m</span>
          </div>
          <Link
            to="/fabrics"
            className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-[#FAF7F2] border border-white/10 rounded text-xs uppercase font-medium tracking-wider transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-[#B8935A]" />
            <span>Customer Storefront</span>
          </Link>
        </div>
      </aside>

      {/* =================================================================== */}
      {/* 2. MAIN COMPACT CONTENT AREA - Sticky Main Detail Header & Scrollable Body */}
      {/* =================================================================== */}
      <main className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden bg-[#F8F5F0]">
        {/* Sticky Top Action Bar & Header Detail */}
        <header className="shrink-0 z-20 bg-[#F8F5F0] px-5 md:px-8 pt-5 pb-3 border-b border-[#5C1A32]/10 shadow-xs">
          <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A89F95]">
                ATELIER MANAGEMENT / {activeTab.toUpperCase()}
              </span>
              <h1 className="text-xl font-normal text-[#1B1512]" style={serif}>
                {activeTab === 'dashboard' && 'Operations Overview'}
                {activeTab === 'fabrics' &&
                  `Fabric Pricing & Inventory (${allFabrics.length} Total SKUs)`}
                {activeTab === 'accessories' && 'Accessories & Embellishments Pricing'}
                {activeTab === 'orders' && 'Bespoke Orders & Master Tailor Measurements'}
                {activeTab === 'users' &&
                  `Registered Clients Directory (${registeredUsers.length} Users)`}
                {activeTab === 'reviews' &&
                  `Client Ratings & Atelier Reviews (${reviews.length} Total)`}
                {activeTab === 'failedPayments' && 'Failed Payments & Background Cron Job'}
                {activeTab === 'visuals' && 'AI Visuals & Editorial Video Reel'}
                {activeTab === 'garments' &&
                  `Garment Items, Sub-Divisions & Tailoring Pricing (${garmentsList.length} Items)`}
                {activeTab === 'banner' && 'Storefront Promotion Popup Banner'}
                {activeTab === 'coupons' && 'Atelier Privileged Coupons & Promo Codes'}
                {activeTab === 'roles' && 'Staff & Governance Access Control'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {activeTab === 'garments' && (
                <>
                  <button
                    onClick={() => setShowAddGarmentModal(true)}
                    className="px-3.5 py-2 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#451325] flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add New Item
                  </button>
                  <button
                    onClick={handleResetGarmentsToFactory}
                    className="px-3 py-2 bg-[#FAF7F2] border border-[#5C1A32]/25 text-[#5C1A32] hover:bg-[#5C1A32]/5 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset Factory
                  </button>
                </>
              )}

              {activeTab === 'fabrics' && (
                <button
                  onClick={() => setShowAddFabricModal(true)}
                  className="px-3.5 py-2 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#451325] flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Fabric
                </button>
              )}

              {activeTab === 'accessories' && (
                <button
                  onClick={() => setShowAddAccModal(true)}
                  className="px-3.5 py-2 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#451325] flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Accessory
                </button>
              )}

              <button
                onClick={() => void handleTriggerCron()}
                disabled={cronRunning}
                className="px-3 py-2 bg-[#FAF7F2] border border-[#5C1A32]/25 text-[#5C1A32] hover:bg-[#5C1A32]/5 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
                {cronRunning ? 'Running Cron...' : 'Reconcile Payments'}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Data Body (Only Down Data Scrolls) */}
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 space-y-6">
          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 Compact Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Total Revenue
                  </span>
                  <div className="text-2xl font-normal text-[#5C1A32] mt-0.5" style={serif}>
                    {formatRupees(metrics.totalRevenue)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {metrics.paidCount} Completed Orders
                  </span>
                </div>

                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Active Customizations
                  </span>
                  <div className="text-2xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    {metrics.activeCustomizations}
                  </div>
                  <span className="text-[10px] text-[#B8935A] font-medium">
                    In Master Tailor Queue
                  </span>
                </div>

                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Total Fabric Weaves
                  </span>
                  <div className="text-2xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    {allFabrics.length.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-[#544B45]">All Editable in Admin</span>
                </div>

                <div className="bg-white border border-rose-900/20 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-rose-800 block">
                    Failed Payments Tracked
                  </span>
                  <div className="text-2xl font-normal text-rose-800 mt-0.5" style={serif}>
                    {metrics.failedCount + (cronStatus?.counts.failed ?? 0)}
                  </div>
                  <span className="text-[10px] text-rose-600 font-medium">
                    Background Cron Active
                  </span>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab('fabrics')}
                  className="bg-white border border-[#5C1A32]/12 hover:border-[#5C1A32] p-5 rounded-lg shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#1B1512]">
                      Edit All {allFabrics.length} Fabric Prices
                    </h3>
                    <p className="text-xs text-[#544B45] mt-0.5">
                      Search and change price per meter, apply bulk discounts, or add new fabrics.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#5C1A32] group-hover:translate-x-1 transition-transform" />
                </div>

                <div
                  onClick={() => setActiveTab('orders')}
                  className="bg-white border border-[#5C1A32]/12 hover:border-[#5C1A32] p-5 rounded-lg shadow-2xs cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#1B1512]">
                      Inspect Customer Measurements & Orders
                    </h3>
                    <p className="text-xs text-[#544B45] mt-0.5">
                      View customer fitting sheets, phone, address, and dispatch statuses.
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#5C1A32] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#5C1A32]/10 flex items-center justify-between">
                  <h3 className="text-xs uppercase font-semibold tracking-wider text-[#1B1512]">
                    Recent Bespoke Customizations
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#5C1A32] font-semibold hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>

                <div className="divide-y divide-[#5C1A32]/10">
                  {orders.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        setSelectedOrder(o);
                        setActiveTab('orders');
                      }}
                      className="p-4 flex items-center justify-between hover:bg-[#FAF7F2]/60 cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#1B1512]">
                            {o.orderDetails.garment.toUpperCase()} — {o.orderDetails.fabricName}
                          </span>
                          <span className="text-[10px] text-[#A89F95] font-mono">({o.id})</span>
                        </div>
                        <p className="text-[11px] text-[#544B45] mt-0.5">
                          Client: <strong>{o.address.fullName}</strong> ({o.address.phone}) ·{' '}
                          {o.address.city}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-semibold text-[#5C1A32]">
                          {formatRupees(o.orderDetails.total)}
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-[#B8935A]">
                          {o.status ?? 'placed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ALL FABRICS PRICING TAB (With Full Pagination & Add Fabric) ── */}
          {activeTab === 'fabrics' && (
            <div className="space-y-4">
              {/* Search, Filter & Bulk Row (Sticky above table) */}
              <div className="sticky top-0 z-10 bg-[#F8F5F0] pb-2 pt-0">
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-3.5 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Search */}
                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A89F95]" />
                    <input
                      type="text"
                      placeholder="Search fabric name or weave..."
                      value={fabricSearch}
                      onChange={(e) => setFabricSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded text-xs text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                  </div>

                  {/* Filters & Items Per Page */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <select
                      value={fabricToneFilter}
                      onChange={(e) => setFabricToneFilter(e.target.value)}
                      className="bg-[#FAF7F2] border border-[#5C1A32]/20 px-2.5 py-1.5 rounded text-xs text-[#1B1512]"
                    >
                      <option value="all">All Tones</option>
                      <option value="warm">Warm Tones</option>
                      <option value="cool">Cool Tones</option>
                      <option value="neutral">Neutral Tones</option>
                    </select>

                    <select
                      value={fabricMaterialFilter}
                      onChange={(e) => setFabricMaterialFilter(e.target.value)}
                      className="bg-[#FAF7F2] border border-[#5C1A32]/20 px-2.5 py-1.5 rounded text-xs text-[#1B1512] max-w-[150px]"
                    >
                      <option value="all">All Materials</option>
                      {materialsList.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5 border-l border-[#5C1A32]/15 pl-2.5">
                      <span className="text-[10px] text-[#A89F95] uppercase font-semibold">
                        Show:
                      </span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-[#FAF7F2] border border-[#5C1A32]/20 px-2 py-1.5 rounded text-xs text-[#1B1512]"
                      >
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                        <option value={100}>100 / page</option>
                        <option value={200}>200 / page</option>
                      </select>
                    </div>

                    {/* Bulk tool */}
                    <div className="flex items-center gap-1 bg-[#FAF7F2] px-2 py-1 rounded border border-[#5C1A32]/15">
                      <span className="text-[10px] font-semibold text-[#544B45]">Bulk %:</span>
                      <input
                        type="number"
                        value={bulkPercent}
                        onChange={(e) => setBulkPercent(e.target.value)}
                        className="w-12 bg-white border border-[#5C1A32]/25 px-1 py-0.5 text-xs rounded text-center"
                      />
                      <button
                        onClick={() => void handleBulkAdjustFabrics(1)}
                        className="px-2 py-0.5 bg-[#5C1A32] text-white text-[10px] font-semibold rounded"
                      >
                        +
                      </button>
                      <button
                        onClick={() => void handleBulkAdjustFabrics(-1)}
                        className="px-2 py-0.5 bg-white border border-[#5C1A32]/30 text-[#5C1A32] text-[10px] font-semibold rounded"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fabrics Table */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#5C1A32]/15 text-[#5C1A32] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Swatch</th>
                        <th className="py-2.5 px-3">Fabric Name & ID</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Tone</th>
                        <th className="py-2.5 px-3">Current Price</th>
                        <th className="py-2.5 px-3">New Price (₹/m)</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#5C1A32]/10">
                      {paginatedFabrics.map((fabric) => {
                        const effectivePrice =
                          customFabricPrices[fabric.id] ?? fabric.pricePerMeter;
                        const isCustom = fabric.id in customFabricPrices;
                        const editValue = editingPriceMap[fabric.id] ?? String(effectivePrice);
                        const isSaving = savingFabricId === fabric.id;

                        return (
                          <tr key={fabric.id} className="hover:bg-[#FAF7F2]/40 transition-colors">
                            <td className="py-2.5 px-3">
                              <div
                                className="w-6 h-6 rounded border border-[#1B1512]/20 shadow-xs"
                                style={{ backgroundColor: fabric.hex }}
                                title={fabric.hex}
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <strong className="text-[#1B1512] block">{fabric.name}</strong>
                              <span className="text-[10px] font-mono text-[#A89F95]">
                                {fabric.id}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#544B45]">
                              {fabric.material || 'Silk'}
                            </td>
                            <td className="py-2.5 px-3 uppercase text-[10px] tracking-wider text-[#B8935A] font-semibold">
                              {fabric.tone}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#1B1512]">
                              {formatRupees(effectivePrice)}/m
                              {isCustom && (
                                <span className="ml-1.5 px-1 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] rounded">
                                  Custom
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[#A89F95]">₹</span>
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) =>
                                    setEditingPriceMap((prev) => ({
                                      ...prev,
                                      [fabric.id]: e.target.value,
                                    }))
                                  }
                                  className="w-20 px-2 py-0.5 bg-[#FAF7F2] border border-[#5C1A32]/25 rounded text-xs text-[#1B1512] font-semibold focus:outline-none focus:border-[#5C1A32]"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() =>
                                  void handleSaveFabricPrice(fabric.id, fabric.pricePerMeter)
                                }
                                disabled={isSaving}
                                className="px-2.5 py-1 bg-[#5C1A32] text-[#FAF7F2] text-[10px] font-semibold uppercase tracking-wider rounded hover:bg-[#451325] transition-colors disabled:opacity-50"
                              >
                                {isSaving ? 'Saving...' : 'Save & Sync'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-4 py-3 bg-[#FAF7F2] border-t border-[#5C1A32]/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#544B45]">
                  <span>
                    Showing {Math.min(filteredFabrics.length, (fabricPage - 1) * pageSize + 1)} -{' '}
                    {Math.min(filteredFabrics.length, fabricPage * pageSize)} of{' '}
                    <strong className="text-[#1B1512]">{filteredFabrics.length}</strong> fabrics
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFabricPage((p) => Math.max(1, p - 1))}
                      disabled={fabricPage === 1}
                      className="p-1 rounded border border-[#5C1A32]/20 hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="font-semibold text-[#1B1512]">
                      Page {fabricPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setFabricPage((p) => Math.min(totalPages, p + 1))}
                      disabled={fabricPage >= totalPages}
                      className="p-1 rounded border border-[#5C1A32]/20 hover:bg-white disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal: Add New Fabric */}
              {showAddFabricModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white max-w-md w-full border border-[#5C1A32]/30 rounded-lg p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-[#5C1A32]/10 pb-3">
                      <h3 className="text-base font-normal text-[#1B1512]" style={serif}>
                        Add New Fabric SKU to Library
                      </h3>
                      <button
                        onClick={() => setShowAddFabricModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-[#1B1512] mb-1">
                          Fabric Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Royal Maroon Mulberry Silk"
                          value={newFabricName}
                          onChange={(e) => setNewFabricName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none focus:border-[#5C1A32]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#1B1512] mb-1">Tone</label>
                          <select
                            value={newFabricTone}
                            onChange={(e) =>
                              setNewFabricTone(e.target.value as 'warm' | 'cool' | 'neutral')
                            }
                            className="w-full px-2.5 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                          >
                            <option value="warm">Warm</option>
                            <option value="cool">Cool</option>
                            <option value="neutral">Neutral</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#1B1512] mb-1">
                            Material / Weave
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Raw Silk"
                            value={newFabricMaterial}
                            onChange={(e) => setNewFabricMaterial(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#1B1512] mb-1">
                            Price per Metre (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 750"
                            value={newFabricPrice}
                            onChange={(e) => setNewFabricPrice(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#1B1512] mb-1">
                            Color Swatch (Hex)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newFabricHex}
                              onChange={(e) => setNewFabricHex(e.target.value)}
                              className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={newFabricHex}
                              onChange={(e) => setNewFabricHex(e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-[#5C1A32]/25 rounded text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#1B1512] mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Description for customers browsing the fabric library"
                          value={newFabricDesc}
                          onChange={(e) => setNewFabricDesc(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                      <button
                        onClick={() => setShowAddFabricModal(false)}
                        className="px-4 py-1.5 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleAddNewFabric()}
                        disabled={addingFabric}
                        className="px-4 py-1.5 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold rounded hover:bg-[#451325]"
                      >
                        {addingFabric ? 'Adding Fabric...' : 'Save Fabric'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACCESSORIES PRICING TAB ───────────────────────────────────── */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1B1512]">
                    Accessories & Embellishments Amount
                  </h3>
                  <p className="text-xs text-[#544B45] mt-0.5">
                    Update amount in rupees for embellishments. Values automatically sync with user
                    customizer.
                  </p>
                </div>

                <button
                  onClick={() => void handleSaveAccessories()}
                  disabled={savingAccessories}
                  className="px-4 py-2 bg-[#5C1A32] hover:bg-[#451325] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingAccessories ? 'Saving...' : 'Save All Amounts'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accessories.map((acc) => {
                  const currentEditPrice = editingAccPriceMap[acc.id] ?? String(acc.price);

                  return (
                    <div
                      key={acc.id}
                      className={`bg-white border rounded-lg p-4 shadow-2xs flex flex-col justify-between ${
                        acc.active ? 'border-[#5C1A32]/20' : 'border-gray-200 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-[#B8935A]">
                            {acc.category ?? 'Embellishment'}
                          </span>
                          <button
                            onClick={() => void handleToggleAccessory(acc.id)}
                            className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded border ${
                              acc.active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border-gray-300'
                            }`}
                          >
                            {acc.active ? 'Active' : 'Disabled'}
                          </button>
                        </div>

                        <h4 className="text-sm font-semibold text-[#1B1512] mt-1">{acc.label}</h4>
                        <p className="text-xs text-[#544B45] mt-1 line-clamp-2">
                          {acc.description || 'Custom atelier embellishment'}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#5C1A32]/10 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[#5C1A32]">₹</span>
                          <input
                            type="number"
                            value={currentEditPrice}
                            onChange={(e) =>
                              setEditingAccPriceMap((prev) => ({
                                ...prev,
                                [acc.id]: e.target.value,
                              }))
                            }
                            className="w-20 px-2 py-0.5 bg-[#FAF7F2] border border-[#5C1A32]/25 rounded text-xs text-[#1B1512] font-semibold"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => void handleSaveAccessories()}
                            className="px-2 py-1 bg-[#5C1A32] text-[#FAF7F2] text-[10px] font-semibold rounded hover:bg-[#451325]"
                          >
                            Update
                          </button>
                          {acc.category === 'custom' && (
                            <button
                              onClick={() => void handleDeleteAccessory(acc.id)}
                              className="p-1 text-rose-600 hover:text-rose-800"
                              title="Delete custom accessory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Accessory Modal */}
              {showAddAccModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white max-w-md w-full border border-[#5C1A32]/30 rounded-lg p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-[#5C1A32]/10 pb-3">
                      <h3 className="text-base font-normal text-[#1B1512]" style={serif}>
                        Add New Accessory Option
                      </h3>
                      <button
                        onClick={() => setShowAddAccModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-[#1B1512] mb-1">
                          Accessory Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pearl Border Lace"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#1B1512] mb-1">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={newAccPrice}
                            onChange={(e) => setNewAccPrice(e.target.value)}
                            className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#1B1512] mb-1">
                            Category
                          </label>
                          <select
                            value={newAccCat}
                            onChange={(e) => setNewAccCat(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                          >
                            <option value="embellishment">Embellishment</option>
                            <option value="border">Border / Lace</option>
                            <option value="latkan">Latkan / Tassels</option>
                            <option value="lining">Lining</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#1B1512] mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Description shown to customer"
                          value={newAccDesc}
                          onChange={(e) => setNewAccDesc(e.target.value)}
                          className="w-full px-3 py-1.5 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                      <button
                        onClick={() => setShowAddAccModal(false)}
                        className="px-4 py-1.5 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void handleAddNewAccessory()}
                        className="px-4 py-1.5 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold rounded hover:bg-[#451325]"
                      >
                        Add & Sync
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS & USER DATA TAB (Clean, Spacious & Never Hidden) ─────── */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-semibold text-[#1B1512]">
                    Filter by Payment:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'paid' | 'pending' | 'failed')
                    }
                    className="bg-[#FAF7F2] border border-[#5C1A32]/20 px-2.5 py-1.5 rounded text-xs text-[#1B1512]"
                  >
                    <option value="all">All Orders ({orders.length})</option>
                    <option value="paid">Paid & Confirmed</option>
                    <option value="pending">Pending Checkout</option>
                    <option value="failed">Failed Payment</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleExportOrdersCsv}
                    className="px-3.5 py-1.5 bg-[#1B1512] hover:bg-[#5C1A32] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 transition-colors"
                    title="Export currently filtered orders to CSV for dispatch and accounting"
                  >
                    <Download className="h-3.5 w-3.5 text-[#B8935A]" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => void refreshOrders()}
                    className="inline-flex items-center gap-1.5 text-xs text-[#5C1A32] font-semibold hover:underline"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg shadow-2xs overflow-hidden">
                {loadingOrders ? (
                  <div className="p-12 text-center text-xs text-[#544B45]">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#B8935A] mb-2" />
                    Loading bespoke orders...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center text-[#544B45]">
                    <Package className="h-8 w-8 mx-auto text-[#B8935A] mb-2 opacity-60" />
                    <p className="font-semibold text-sm">No orders found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#5C1A32]/10">
                    {orders
                      .filter((o) => {
                        if (statusFilter === 'all') return true;
                        if (statusFilter === 'paid')
                          return o.paymentStatus === 'paid' || Boolean(o.paymentId);
                        if (statusFilter === 'failed') return o.paymentStatus === 'failed';
                        return o.paymentStatus === 'pending' && !o.paymentId;
                      })
                      .map((o) => (
                        <div
                          key={o.id}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF7F2]/40 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#1B1512]">
                                {o.orderDetails.garment.toUpperCase()} — {o.orderDetails.fabricName}
                              </span>
                              <span className="text-[10px] font-mono bg-[#FAF7F2] border border-[#5C1A32]/15 px-1.5 py-0.5 rounded text-[#544B45]">
                                {o.id}
                              </span>
                              {o.paymentStatus === 'failed' && (
                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-semibold rounded">
                                  Failed
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#544B45]">
                              Customer:{' '}
                              <strong className="text-[#1B1512]">{o.address.fullName}</strong> (
                              {o.address.phone}) · {o.address.city}, {o.address.state}
                            </p>

                            {/* BlueDart AWB Tracking Editor */}
                            <div className="flex items-center gap-2 pt-0.5">
                              {editingAwbOrderId === o.id ? (
                                <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded border border-[#5C1A32]/25">
                                  <Truck className="h-3 w-3 text-[#5C1A32] ml-1" />
                                  <input
                                    type="text"
                                    placeholder="e.g. BLU-882941"
                                    value={awbInput}
                                    onChange={(e) => setAwbInput(e.target.value)}
                                    className="px-2 py-0.5 bg-white border border-[#5C1A32]/30 rounded text-xs font-mono uppercase w-32 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => void handleSaveAwb(o.id, o.username, o.status)}
                                    disabled={savingAwb}
                                    className="px-2 py-0.5 bg-[#5C1A32] text-white text-[10px] font-semibold rounded hover:bg-[#451325]"
                                  >
                                    {savingAwb ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingAwbOrderId(null);
                                      setAwbInput('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-[10px] px-1"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-[11px] text-[#8A7968]">AWB Tracking:</span>
                                  {o.trackingNumber ? (
                                    <span className="font-mono font-bold text-[#1B1512] bg-[#FAF7F2] border border-[#5C1A32]/15 px-1.5 py-0.5 rounded text-[11px]">
                                      {o.trackingNumber}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic text-[11px]">
                                      Not assigned
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingAwbOrderId(o.id);
                                      setAwbInput(o.trackingNumber || '');
                                    }}
                                    className="text-[10px] text-[#5C1A32] font-semibold hover:underline flex items-center gap-0.5 ml-1"
                                    title="Edit BlueDart AWB tracking number"
                                  >
                                    <Truck className="h-3 w-3 text-[#B8935A]" />
                                    {o.trackingNumber ? 'Edit AWB' : '+ Assign AWB'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-[#5C1A32]">
                                {formatRupees(o.orderDetails.total)}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[9px] text-[#A89F95] uppercase font-semibold">
                                  Stage:
                                </span>
                                <select
                                  value={o.status ?? 'placed'}
                                  onChange={(e) =>
                                    void handleUpdateOrderStatus(
                                      o.id,
                                      o.username,
                                      e.target.value as OrderStatus,
                                    )
                                  }
                                  className="bg-[#FAF7F2] border border-[#5C1A32]/20 px-2 py-0.5 rounded text-xs text-[#1B1512]"
                                >
                                  {ORDER_STATUS_STEPS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Print Master Tailor Job Card */}
                            <button
                              onClick={() => {
                                setJobCardOrder(o);
                                setShowJobCardModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#B8935A]/15 hover:bg-[#B8935A]/25 border border-[#B8935A]/40 text-[#8C6524] text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5"
                              title="Print Master Tailor Cutting & Production Sheet"
                            >
                              <Scissors className="h-3.5 w-3.5 text-[#B8935A]" />
                              Job Card
                            </button>

                            <button
                              onClick={() => {
                                setInvoiceOrder(o);
                                setShowInvoiceModal(true);
                              }}
                              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#5C1A32]/10 border border-[#5C1A32]/25 text-[#5C1A32] text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5"
                              title="Download or preview Amazon-format Tax Invoice"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Invoice
                            </button>

                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-3 py-1.5 bg-[#1B1512] hover:bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Full Sheet
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* EXPANDABLE SPECIFICATION MODAL (NO DATA HIDDEN, FULL VISIBILITY) */}
              {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-[#5C1A32]/30 rounded-xl p-6 shadow-2xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-5">
                      {/* Header */}
                      <div className="flex justify-between items-start border-b border-[#5C1A32]/10 pb-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B8935A] font-semibold">
                            BESPOKE SPECIFICATION & FITTINGS
                          </span>
                          <h3 className="text-xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                            {selectedOrder.orderDetails.garment.toUpperCase()} —{' '}
                            {selectedOrder.orderDetails.fabricName}
                          </h3>
                          <p className="text-xs text-[#544B45] font-mono mt-0.5">
                            Order ID: {selectedOrder.id}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Customer & Address Information */}
                      <div className="bg-[#FAF7F2] p-4 rounded-lg border border-[#5C1A32]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-[#A89F95] block mb-1">
                            Client Contact
                          </span>
                          <p className="font-bold text-[#1B1512] text-sm">
                            {selectedOrder.address.fullName}
                          </p>
                          <p className="text-[#544B45] mt-0.5">
                            Phone: {selectedOrder.address.phone}
                          </p>
                          <p className="text-[#544B45]">User Account: @{selectedOrder.username}</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-[#A89F95] block mb-1">
                            Delivery Address
                          </span>
                          <p className="text-[#1B1512] font-medium leading-relaxed">
                            {selectedOrder.address.line1}
                            {selectedOrder.address.line2 ? `, ${selectedOrder.address.line2}` : ''}
                          </p>
                          <p className="text-[#544B45]">
                            {selectedOrder.address.city}, {selectedOrder.address.state} —{' '}
                            {selectedOrder.address.pincode}
                          </p>
                        </div>
                      </div>

                      {/* Master Tailor Measurements (ALL FIELDS VISIBLE & BEAUTIFULLY SPACED) */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="text-xs uppercase font-semibold tracking-wider text-[#5C1A32]">
                            Master Tailor Measurements
                          </h4>
                          {selectedOrder.orderDetails.bodyType && (
                            <span className="text-[11px] font-semibold text-[#B8935A]">
                              Profile:{' '}
                              {BODY_TYPE_LABELS[selectedOrder.orderDetails.bodyType] ??
                                selectedOrder.orderDetails.bodyType}
                            </span>
                          )}
                        </div>

                        {selectedOrder.orderDetails.measurementValues &&
                        Object.keys(selectedOrder.orderDetails.measurementValues).length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#FAF7F2] p-4 rounded-lg border border-[#5C1A32]/10 text-xs">
                            {Object.entries(selectedOrder.orderDetails.measurementValues).map(
                              ([key, val]) => (
                                <div
                                  key={key}
                                  className="bg-white p-2.5 rounded border border-[#5C1A32]/10"
                                >
                                  <span className="text-[10px] uppercase tracking-wider text-[#A89F95] block truncate font-medium">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                  </span>
                                  <span className="text-sm font-bold text-[#1B1512] mt-0.5 block">
                                    {val} in
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#544B45] italic p-3 bg-[#FAF7F2] rounded">
                            Standard master artisan tailoring measurements applied.
                          </p>
                        )}
                      </div>

                      {/* Add-ons & Reference Sketch */}
                      {selectedOrder.orderDetails.accessories &&
                        selectedOrder.orderDetails.accessories.length > 0 && (
                          <div>
                            <h4 className="text-xs uppercase font-semibold tracking-wider text-[#5C1A32] mb-1.5">
                              Selected Embellishments
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedOrder.orderDetails.accessories.map((a) => (
                                <span
                                  key={a.id}
                                  className="px-2.5 py-1 bg-[#FAF7F2] border border-[#5C1A32]/15 rounded text-xs text-[#1B1512]"
                                >
                                  {a.label} (+₹{a.price})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedOrder.orderDetails.referenceImage?.dataUrl && (
                        <div>
                          <h4 className="text-xs uppercase font-semibold tracking-wider text-[#5C1A32] mb-1.5">
                            Uploaded Customer Reference Photo
                          </h4>
                          <img
                            src={selectedOrder.orderDetails.referenceImage.dataUrl}
                            alt="Customer Design Reference"
                            className="max-h-56 rounded border border-[#5C1A32]/20 object-contain bg-black/5"
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer & Close */}
                    <div className="pt-4 border-t border-[#5C1A32]/10 flex items-center justify-between text-xs mt-4">
                      <div>
                        <span className="text-[#A89F95] text-[10px] uppercase font-semibold block">
                          Order Total
                        </span>
                        <div className="text-xl font-bold text-[#5C1A32]" style={serif}>
                          {formatRupees(selectedOrder.orderDetails.total)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setJobCardOrder(selectedOrder);
                            setShowJobCardModal(true);
                          }}
                          className="px-4 py-2 bg-[#B8935A] hover:bg-[#9a7844] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm transition-colors"
                          title="Print Haute Couture Master Tailor Cutting & Production Sheet"
                        >
                          <Scissors className="h-3.5 w-3.5" />
                          Print Job Card
                        </button>

                        <button
                          onClick={() => {
                            setInvoiceOrder(selectedOrder);
                            setShowInvoiceModal(true);
                          }}
                          className="px-4 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Download Amazon Tax Invoice (PDF)
                        </button>

                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="px-5 py-2 bg-[#1B1512] text-[#FAF7F2] text-xs font-semibold rounded hover:bg-[#5C1A32] transition-colors"
                        >
                          Close Sheet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FAILED PAYMENTS & CRON TAB ─────────────────────────────────── */}
          {activeTab === 'failedPayments' && (
            <div className="space-y-4">
              <div className="bg-white border border-rose-900/20 rounded-lg p-5 shadow-2xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-rose-800">
                        BACKGROUND RECONCILIATION CRON
                      </span>
                    </div>
                    <h3 className="text-lg font-normal text-[#1B1512]" style={serif}>
                      Automated Failed Payment Recovery Engine
                    </h3>
                    <p className="text-xs text-[#544B45] mt-0.5 max-w-xl">
                      Runs every 5 minutes in background Node.js. Scans abandoned checkouts, marks
                      timed-out pending sessions as expired/failed, and tracks recovery links.
                    </p>
                  </div>

                  <button
                    onClick={() => void handleTriggerCron()}
                    disabled={cronRunning}
                    className="px-4 py-2.5 bg-rose-900 hover:bg-rose-950 text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
                    {cronRunning ? 'Executing Cron...' : 'Run Cron Immediately'}
                  </button>
                </div>

                {/* Status info row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-rose-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                      Cron State
                    </span>
                    <span className="font-semibold text-emerald-700">Active (5m Interval)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                      Stale Timeout
                    </span>
                    <span className="font-semibold text-[#1B1512]">&gt; 15 mins Pending</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                      Last Run
                    </span>
                    <span className="font-semibold text-[#5C1A32]">
                      {cronStatus?.lastRun
                        ? formatDateTime(cronStatus.lastRun.timestamp)
                        : 'Recent'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                      Failed Tracked
                    </span>
                    <span className="font-semibold text-rose-800">
                      {metrics.failedCount + (cronStatus?.counts.failed ?? 0)} checkouts
                    </span>
                  </div>
                </div>

                {lastCronResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      {lastCronResult.message} ({lastCronResult.durationMs}ms)
                    </span>
                  </div>
                )}
              </div>

              {/* Failed Orders List */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-[#5C1A32]/10">
                  <h4 className="text-xs uppercase font-semibold tracking-wider text-[#1B1512]">
                    Tracked Failed Checkout Attempts
                  </h4>
                </div>

                <div className="divide-y divide-[#5C1A32]/10">
                  {orders.filter((o) => o.paymentStatus === 'failed').length === 0 ? (
                    <div className="p-10 text-center text-[#544B45]">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2 opacity-70" />
                      <p className="font-semibold text-sm">
                        All payments are healthy and reconciled!
                      </p>
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.paymentStatus === 'failed')
                      .map((o) => (
                        <div
                          key={o.id}
                          className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-rose-50/20"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-[#1B1512]">
                                {o.orderDetails.garment.toUpperCase()} — {o.orderDetails.fabricName}
                              </span>
                              <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                FAILED
                              </span>
                            </div>
                            <p className="text-xs text-[#544B45] mt-0.5">
                              Client: <strong>{o.address.fullName}</strong> ({o.address.phone}) ·
                              Placed: {formatDateTime(o.placedAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-rose-900">
                              {formatRupees(o.orderDetails.total)}
                            </span>
                            <button
                              onClick={() => {
                                showToast(
                                  `Payment recovery link created for ${o.address.fullName}!`,
                                );
                              }}
                              className="px-3 py-1 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold rounded hover:bg-[#451325]"
                            >
                              Send Recovery Link
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── AI VISUALS TAB ────────────────────────────────────────────── */}
          {activeTab === 'visuals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg overflow-hidden shadow-2xs">
                  <div className="aspect-[3/4] bg-[#EDE5D8] overflow-hidden relative group">
                    <img
                      src="/images/hero-model.jpg"
                      alt="Bridal Editorial Couture"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 text-[#FAF7F2]">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#B8935A] block">
                        HERO EDITORIAL
                      </span>
                      <h4 className="text-sm font-normal" style={serif}>
                        The Kasavu & Zari Bridal Suite
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#5C1A32]/12 rounded-lg overflow-hidden shadow-2xs">
                  <div className="aspect-[3/4] bg-[#EDE5D8] overflow-hidden relative group">
                    <img
                      src="/images/artisan-embroidery.jpg"
                      alt="Master Artisan Embroidery"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 text-[#FAF7F2]">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#B8935A] block">
                        ATELIER CRAFTSMANSHIP
                      </span>
                      <h4 className="text-sm font-normal" style={serif}>
                        Master Zardozi Needlework
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#5C1A32]/12 rounded-lg overflow-hidden shadow-2xs">
                  <div className="aspect-[3/4] bg-[#EDE5D8] overflow-hidden relative group">
                    <img
                      src="/images/fabric-swatches.jpg"
                      alt="Fabric Weaves Swatches"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 text-[#FAF7F2]">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#B8935A] block">
                        TEXTILE ARCHIVE
                      </span>
                      <h4 className="text-sm font-normal" style={serif}>
                        Raw Silk & Brocade Flatlay
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGISTERED USERS DIRECTORY TAB ─────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search by client name, email, or phone..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#5C1A32]/20 rounded text-xs text-[#1B1512] focus:outline-none focus:border-[#5C1A32]"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-xs"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void refreshUsers()}
                    disabled={loadingUsers}
                    className="px-3 py-1.5 bg-[#FAF7F2] border border-[#5C1A32]/25 text-[#5C1A32] text-xs font-semibold rounded hover:bg-[#5C1A32]/5 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Refresh Clients
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Total Patrons
                  </span>
                  <div className="text-2xl font-normal text-[#5C1A32] mt-0.5" style={serif}>
                    {registeredUsers.length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Registered in DB</span>
                </div>
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Admin Roles
                  </span>
                  <div className="text-2xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    {registeredUsers.filter((u) => u.role === 'admin').length}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-medium">Atelier Managers</span>
                </div>
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Female Patrons
                  </span>
                  <div className="text-2xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    {registeredUsers.filter((u) => u.gender.toLowerCase() === 'female').length}
                  </div>
                  <span className="text-[10px] text-purple-700 font-medium">Bespoke Couture</span>
                </div>
                <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#A89F95] block">
                    Male Patrons
                  </span>
                  <div className="text-2xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    {registeredUsers.filter((u) => u.gender.toLowerCase() === 'male').length}
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">
                    Royal Sherwani/Coats
                  </span>
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg shadow-2xs overflow-hidden">
                <div className="px-5 py-3 border-b border-[#5C1A32]/10 flex items-center justify-between">
                  <h4 className="text-xs uppercase font-semibold tracking-wider text-[#1B1512]">
                    Registered Client Records ({registeredUsers.length})
                  </h4>
                  <span className="text-[11px] text-[#A89F95]">
                    Auto-synced on client registration
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#5C1A32]/10 uppercase text-[10px] font-semibold text-[#544B45]">
                        <th className="p-3.5">Client Profile</th>
                        <th className="p-3.5">Contact Details</th>
                        <th className="p-3.5">Gender</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Joined Date</th>
                        <th className="p-3.5 text-center">Orders</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#5C1A32]/10">
                      {registeredUsers
                        .filter((u) => {
                          if (!userSearch.trim()) return true;
                          const q = userSearch.toLowerCase();
                          return (
                            u.username.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            u.phoneNumber.toLowerCase().includes(q)
                          );
                        })
                        .map((u) => {
                          const userOrders = orders.filter((o) => o.username === u.username);
                          const userSpend = userOrders.reduce(
                            (sum, o) => sum + (o.orderDetails.total || 0),
                            0,
                          );

                          return (
                            <tr key={u._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#5C1A32]/10 text-[#5C1A32] font-bold flex items-center justify-center text-xs shrink-0">
                                    {u.username.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#1B1512] block">
                                      {u.username}
                                    </span>
                                    <span className="text-[10px] text-[#8A7968]">
                                      ID: {u._id.slice(-6).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <div className="space-y-0.5">
                                  <span className="text-[#1B1512] block">{u.email}</span>
                                  <span className="text-[10px] text-[#8A7968]">
                                    {u.phoneNumber || 'No phone recorded'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 capitalize text-[#544B45]">
                                {u.gender || 'Not specified'}
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    u.role === 'admin'
                                      ? 'bg-purple-50 text-purple-900 border-purple-300'
                                      : u.role === 'staff'
                                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                                        : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  }`}
                                >
                                  {u.role === 'admin'
                                    ? 'Admin'
                                    : u.role === 'staff'
                                      ? 'Staff'
                                      : 'Client'}
                                </span>
                              </td>
                              <td className="p-3.5 text-[#544B45]">
                                {u.createdAt ? formatDate(u.createdAt) : 'Recently'}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className="font-bold text-xs text-[#5C1A32]">
                                  {userOrders.length}
                                </span>
                                {userSpend > 0 && (
                                  <span className="text-[9px] text-[#8A7968] block font-mono">
                                    ({formatRupees(userSpend)})
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={async () => {
                                    if (
                                      confirm(
                                        `Are you sure you want to delete user "${u.username}"?`,
                                      )
                                    ) {
                                      try {
                                        await userApi.deleteUser(u._id);
                                        showToast(`User ${u.username} deleted.`);
                                        void refreshUsers();
                                      } catch {
                                        showToast('Failed to delete user.');
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-rose-600 rounded transition-colors"
                                  title="Remove User Account"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ROLE-BASED ACCESS & STAFF MANAGEMENT TAB (Admin Only) ─────── */}
          {isAdmin && activeTab === 'roles' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#B8935A] block">
                    SECURITY &amp; GOVERNANCE
                  </span>
                  <h3 className="text-xl font-normal text-[#1B1512] mt-0.5" style={serif}>
                    Staff &amp; Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-xs text-[#544B45] mt-1 leading-relaxed">
                    Grant Atelier privileges by Email ID. Staff members can access bespoke orders,
                    master tailor cutting sheets, fabric pricing, accessories, and coupons without
                    accessing user management or payment cron controls.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void refreshUsers()}
                    disabled={loadingUsers}
                    className="px-3.5 py-2 bg-[#FAF7F2] border border-[#5C1A32]/25 text-[#5C1A32] text-xs font-semibold rounded-lg hover:bg-[#5C1A32]/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                    Sync Roles
                  </button>
                </div>
              </div>

              {/* Email ID Role Assigner Form */}
              <div className="bg-white border border-[#5C1A32]/15 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-[#5C1A32]/10 pb-3">
                  <KeyRound className="h-4 w-4 text-[#B8935A]" />
                  <h4 className="text-sm font-bold text-[#1B1512]">Assign Role by Email ID</h4>
                </div>

                <form
                  onSubmit={handleAssignRole}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                >
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#8A7968] block">
                      Account Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. staff@jojoboutique.com or user email"
                      value={roleEmailInput}
                      onChange={(e) => setRoleEmailInput(e.target.value)}
                      required
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#5C1A32]/25 rounded-lg text-xs font-medium text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#8A7968] block">
                      Assign Permission Role
                    </label>
                    <select
                      value={roleSelectValue}
                      onChange={(e) => setRoleSelectValue(e.target.value as 'admin' | 'staff')}
                      className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#5C1A32]/25 rounded-lg text-xs font-semibold text-[#1B1512] focus:outline-none focus:border-[#5C1A32] focus:bg-white cursor-pointer"
                    >
                      <option value="admin">Admin (Full Atelier Governance)</option>
                      <option value="staff">Staff (Operational &amp; Orders)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={assigningRole}
                      className="w-full py-2.5 px-4 bg-[#5C1A32] hover:bg-[#431224] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4 text-[#B8935A]" />
                      <span>{assigningRole ? 'Updating...' : 'Assign Role'}</span>
                    </button>
                  </div>
                </form>

                {/* Roles Legend / Permission Scope (Admin & Staff Only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#5C1A32]/10 text-xs">
                  <div className="p-3.5 rounded-lg bg-purple-50/70 border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-700" />
                      Role: Administrator (Master)
                    </span>
                    <p className="text-[11px] text-purple-800 leading-snug">
                      Full master governance: all 10 tabs including fabric pricing, coupons, orders
                      &amp; cutting sheets, staff role assignment, registered clients, reviews, and
                      payment cron jobs.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                      Role: Atelier Staff (Operational)
                    </span>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Exclusive operational access strictly limited to: Overview, Fabric Pricing,
                      Accessories, Orders &amp; Data, and Coupons &amp; Promo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Roles Directory Table (Admins & Staff Only) */}
              <div className="bg-white border border-[#5C1A32]/12 rounded-xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-[#5C1A32]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-[#8A7968]">Filter Role:</span>
                    <div className="flex items-center gap-1">
                      {(['all', 'admin', 'staff'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRoleFilter(r)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                            roleFilter === r
                              ? 'bg-[#5C1A32] text-white'
                              : 'bg-[#FAF7F2] text-[#544B45] hover:bg-neutral-100'
                          }`}
                        >
                          {r === 'all'
                            ? `All Team (${registeredUsers.filter((u) => u.role === 'admin' || u.role === 'staff').length})`
                            : r === 'admin'
                              ? `Admins (${registeredUsers.filter((u) => u.role === 'admin').length})`
                              : `Staff (${registeredUsers.filter((u) => u.role === 'staff').length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-[#8A7968]">
                    Switch role between Admin &amp; Staff instantly
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FAF7F2] border-b border-[#5C1A32]/10 uppercase text-[10px] font-bold text-[#544B45]">
                        <th className="p-3.5">Account Profile</th>
                        <th className="p-3.5">Email Address</th>
                        <th className="p-3.5">Contact Phone</th>
                        <th className="p-3.5">Current Role</th>
                        <th className="p-3.5">Change Role</th>
                        <th className="p-3.5 text-right">Registered Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#5C1A32]/10">
                      {registeredUsers
                        .filter((u) => u.role === 'admin' || u.role === 'staff')
                        .filter((u) => {
                          if (roleFilter === 'admin') return u.role === 'admin';
                          if (roleFilter === 'staff') return u.role === 'staff';
                          return true;
                        })
                        .map((u) => (
                          <tr key={u._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                                    u.role === 'admin'
                                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {u.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-[#1B1512] block">
                                    {u.username}
                                  </span>
                                  <span className="text-[10px] text-[#8A7968]">
                                    ID: {u._id.slice(-6).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-medium text-[#1B1512]">{u.email}</td>
                            <td className="p-3.5 text-[#544B45] font-mono">
                              {u.phoneNumber || '—'}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                                  u.role === 'admin'
                                    ? 'bg-purple-50 text-purple-900 border-purple-300'
                                    : 'bg-amber-50 text-amber-900 border-amber-300'
                                }`}
                              >
                                <ShieldCheck className="h-3 w-3" />
                                {u.role === 'admin' ? 'Admin' : 'Staff'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <select
                                value={u.role === 'admin' ? 'admin' : 'staff'}
                                onChange={(e) =>
                                  void handleAssignRole(
                                    undefined,
                                    u.email,
                                    e.target.value as 'admin' | 'staff',
                                  )
                                }
                                className="px-2.5 py-1 bg-white border border-[#5C1A32]/25 rounded text-xs font-semibold text-[#1B1512] focus:outline-none focus:border-[#5C1A32] cursor-pointer"
                              >
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                              </select>
                            </td>
                            <td className="p-3.5 text-right text-[#8A7968]">
                              {u.createdAt ? formatDate(u.createdAt) : 'Recently'}
                            </td>
                          </tr>
                        ))}
                      {registeredUsers.filter((u) => u.role === 'admin' || u.role === 'staff')
                        .length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-[#8A7968]">
                            No staff or admin roles assigned yet. Use the form above to grant
                            privileges by Email ID.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CUSTOMER REVIEWS MODERATION TAB ────────────────────────────── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1512]">
                    Client Reviews &amp; Post-Delivery Ratings
                  </h3>
                  <p className="text-xs text-[#8A7968]">
                    Verified reviews submitted by clients after receiving bespoke garments and
                    fabrics.
                  </p>
                </div>

                <button
                  onClick={() => void refreshReviews()}
                  disabled={loadingReviews}
                  className="px-3 py-1.5 bg-[#FAF7F2] border border-[#5C1A32]/25 text-[#5C1A32] text-xs font-semibold rounded hover:bg-[#5C1A32]/5 flex items-center gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingReviews ? 'animate-spin' : ''}`} />
                  Refresh Reviews
                </button>
              </div>

              {/* Reviews List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.length === 0 ? (
                  <div className="col-span-2 bg-white rounded-lg border border-[#5C1A32]/12 p-8 text-center text-[#8A7968]">
                    <Star className="h-8 w-8 mx-auto text-amber-400 mb-2 opacity-60" />
                    <p className="font-semibold text-sm">No client reviews submitted yet.</p>
                    <p className="text-xs mt-1">
                      Reviews left by clients on the Order Tracking page or Fabric Detail page will
                      display here for moderation.
                    </p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="bg-white border border-[#5C1A32]/12 rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            {'★'.repeat(rev.rating)}
                            <span className="text-[#1B1512] font-bold text-xs ml-1">
                              {rev.rating}.0
                            </span>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              rev.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rev.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#1B1512] mt-2">{rev.title}</h4>
                        <p className="text-xs text-[#4A413B] mt-1 leading-relaxed">
                          "{rev.comment}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#5C1A32]/10 flex items-center justify-between text-[11px] text-[#8A7968]">
                        <div>
                          <span className="font-semibold text-[#1B1512]">{rev.username}</span>
                          {rev.garment && <span> · Tailored as: {rev.garment}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          {rev.status !== 'approved' && (
                            <button
                              onClick={async () => {
                                await reviewApi.updateStatus(rev._id, 'approved');
                                showToast('Review approved!');
                                void refreshReviews();
                              }}
                              className="text-emerald-700 font-bold hover:underline"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (confirm('Delete this review?')) {
                                await reviewApi.deleteReview(rev._id);
                                showToast('Review deleted.');
                                void refreshReviews();
                              }
                            }}
                            className="text-rose-600 font-bold hover:underline ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── COUPONS & PROMO CODES TAB ──────────────────────────────────── */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#5C1A32]/12 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#1B1512] flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#B8935A]" />
                    Atelier Privilege Coupons & Promo Codes
                  </h3>
                  <p className="text-xs text-[#544B45] mt-0.5">
                    Create discount codes for bridal patrons, festive promotions, and bespoke
                    tailoring orders. Live at checkout!
                  </p>
                </div>

                <button
                  onClick={() => setShowAddCouponModal(true)}
                  className="px-4 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Promo Code
                </button>
              </div>

              {/* Coupons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.code}
                    className={`bg-white border rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between transition-all ${
                      coupon.active ? 'border-[#5C1A32]/25' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-bold text-[#5C1A32] tracking-wider bg-[#FAF7F2] border border-[#5C1A32]/20 px-2.5 py-1 rounded-md">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleToggleCoupon(coupon.code)}
                          className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                            coupon.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}
                        >
                          {coupon.active ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      <div className="pt-1">
                        <div className="text-lg font-bold text-[#1B1512]">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} FLAT OFF`}
                        </div>
                        <p className="text-xs text-[#544B45] mt-1 leading-relaxed">
                          {coupon.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#5C1A32]/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#8A7968]">
                        <span>Min Order Value:</span>
                        <strong className="text-[#1B1512]">
                          ₹{coupon.minOrderValue.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[#8A7968]">
                        <span>Times Redeemed:</span>
                        <span className="font-mono text-[#5C1A32] font-semibold">
                          {coupon.usesCount} patrons
                        </span>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (confirm(`Delete promo code "${coupon.code}"?`)) {
                              handleDeleteCoupon(coupon.code);
                            }
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create Coupon Modal */}
              {showAddCouponModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <form
                    onSubmit={handleCreateCoupon}
                    className="bg-white max-w-md w-full border border-[#5C1A32]/30 rounded-xl p-6 shadow-2xl space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-[#5C1A32]/10 pb-3">
                      <h3 className="text-base font-normal text-[#1B1512]" style={serif}>
                        Create Atelier Promo Code
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddCouponModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                          Promo Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BRIDAL20, DIWALI500"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                          required
                          className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded font-mono font-bold uppercase text-[#5C1A32] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                            Discount Type
                          </label>
                          <select
                            value={newCouponType}
                            onChange={(e) =>
                              setNewCouponType(e.target.value as 'percentage' | 'flat')
                            }
                            className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded focus:outline-none bg-white"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Cash (₹)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            placeholder={newCouponType === 'percentage' ? '15' : '500'}
                            value={newCouponValue}
                            onChange={(e) => setNewCouponValue(e.target.value)}
                            required
                            min="1"
                            className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                          Minimum Order Value (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="1500"
                          value={newCouponMin}
                          onChange={(e) => setNewCouponMin(e.target.value)}
                          className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                          Description for Patrons
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. 15% off bespoke festival couture orders"
                          value={newCouponDesc}
                          onChange={(e) => setNewCouponDesc(e.target.value)}
                          className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                      <button
                        type="button"
                        onClick={() => setShowAddCouponModal(false)}
                        className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#5C1A32] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#451325]"
                      >
                        Publish Code
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 11: PROMOTION POPUP BANNER MANAGEMENT ─────────────────── */}
          {activeTab === 'banner' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white p-6 rounded-lg border border-[#5C1A32]/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-[#5C1A32]" />
                    <h2 className="text-xl font-bold text-[#1B1512]" style={serif}>
                      Storefront Popup Banner
                    </h2>
                  </div>
                  <p className="text-xs text-[#8A7968] mt-1">
                    Configure the promotion banner that pops up whenever customers arrive at your
                    website.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      bannerConfig.active
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${bannerConfig.active ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'}`}
                    />
                    {bannerConfig.active ? 'Popup Active on Storefront' : 'Popup Disabled / Off'}
                  </span>
                </div>
              </div>

              {/* Main Content: Form on Left, Live Preview on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form Settings */}
                <form
                  onSubmit={handleSaveBanner}
                  className="lg:col-span-7 bg-white p-6 rounded-lg border border-[#5C1A32]/10 shadow-xs space-y-5"
                >
                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#FAF7F2] rounded-md border border-[#5C1A32]/10">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B1512]">
                        Display Popup to Visitors
                      </h4>
                      <p className="text-[11px] text-[#8A7968]">
                        When enabled, visitors will see this modal popup upon visiting the site.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bannerConfig.active}
                        onChange={(e) =>
                          setBannerConfig((prev) => ({ ...prev, active: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5C1A32]" />
                    </label>
                  </div>

                  {/* Banner Image Settings */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1512]">
                      Banner Image (URL or Downloaded File)
                    </label>

                    {/* Method 1: Image URL */}
                    <div>
                      <span className="text-[10px] text-[#8A7968] block mb-1">
                        Option 1: Paste Image URL
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. /images/hero-model.jpg or https://images.unsplash.com/..."
                          value={
                            bannerConfig.imageUrl.startsWith('data:')
                              ? '[Uploaded Image File from Device]'
                              : bannerConfig.imageUrl
                          }
                          onChange={(e) =>
                            setBannerConfig((prev) => ({ ...prev, imageUrl: e.target.value }))
                          }
                          className="flex-1 px-3 py-2 text-xs border border-[#5C1A32]/20 rounded focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                        />
                      </div>
                    </div>

                    {/* Method 2: File Upload from Computer */}
                    <div className="pt-1">
                      <span className="text-[10px] text-[#8A7968] block mb-1">
                        Option 2: Upload Image Downloaded to Device
                      </span>
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#5C1A32]/30 hover:border-[#5C1A32] rounded bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] cursor-pointer transition-colors text-xs text-[#5C1A32] font-semibold">
                        <Upload className="w-4 h-4" />
                        <span>Select image file from computer (JPG, PNG, WebP)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Headline & Subtitle */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1512] mb-1">
                        Banner Headline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bespoke Haute Couture Atelier"
                        value={bannerConfig.title}
                        onChange={(e) =>
                          setBannerConfig((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs border border-[#5C1A32]/20 rounded focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1512] mb-1">
                        Subtitle / Promotional Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Complimentary Master Tailor Home Measurement in Chennai, Coimbatore & Bengaluru."
                        value={bannerConfig.subtitle}
                        onChange={(e) =>
                          setBannerConfig((prev) => ({ ...prev, subtitle: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs border border-[#5C1A32]/20 rounded focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                      />
                    </div>
                  </div>

                  {/* Button Text & Target Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1512] mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Book A Fitting Visit"
                        value={bannerConfig.buttonText}
                        onChange={(e) =>
                          setBannerConfig((prev) => ({ ...prev, buttonText: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs border border-[#5C1A32]/20 rounded focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1B1512] mb-1">
                        Destination Link URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /measurements or /custom-outfit"
                        value={bannerConfig.linkUrl}
                        onChange={(e) =>
                          setBannerConfig((prev) => ({ ...prev, linkUrl: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-xs border border-[#5C1A32]/20 rounded focus:outline-none focus:ring-1 focus:ring-[#5C1A32]"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#5C1A32]/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetBanner}
                      className="px-4 py-2 border border-gray-300 text-xs font-semibold text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      Reset Default
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#5C1A32] hover:bg-[#431223] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save &amp; Publish Banner
                    </button>
                  </div>
                </form>

                {/* Right Column: Live Modal Mockup Preview */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1B1512] flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#B8935A]" /> Live Storefront Preview
                    </span>
                    <span className="text-[11px] text-[#8A7968]">What customers see</span>
                  </div>

                  {/* Mockup Modal Container */}
                  <div className="relative w-full bg-[#FAF7F2] rounded-lg shadow-xl overflow-hidden border border-[#B8935A]/40">
                    {/* Simulated Close X */}
                    <div className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs">
                      <X className="w-3.5 h-3.5" />
                    </div>

                    {/* Preview Image */}
                    <div className="relative w-full h-48 bg-black overflow-hidden">
                      <img
                        src={bannerConfig.imageUrl || '/images/hero-model.jpg'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/hero-model.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1B1512]/90 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 bg-[#5C1A32] text-[#FAF7F2] text-[9px] tracking-[0.2em] uppercase font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 border border-[#B8935A]/50">
                        <Sparkles className="w-2.5 h-2.5 text-[#B8935A]" /> JoJo Flora Exclusive
                      </div>
                    </div>

                    {/* Preview Text */}
                    <div className="p-5 text-center space-y-2 bg-[#FAF7F2]">
                      <h4 className="text-lg text-[#1B1512] font-normal" style={serif}>
                        {bannerConfig.title || 'Your Promotion Headline'}
                      </h4>
                      <p className="text-xs text-[#4A413B] leading-relaxed line-clamp-2">
                        {bannerConfig.subtitle ||
                          'Your promotional description will appear right here for all website patrons.'}
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          className="px-5 py-2.5 bg-[#5C1A32] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm inline-flex items-center gap-1.5"
                        >
                          <span>{bannerConfig.buttonText || 'Discover Now'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 12: GARMENT ITEMS, SUB-DIVISIONS & TAILORING AMOUNTS ─── */}
          {activeTab === 'garments' && (
            <div className="space-y-6">
              {/* Top Banner & Instructions */}
              <div className="bg-white p-6 rounded-lg border border-[#5C1A32]/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#5C1A32]" />
                    <h2 className="text-xl font-bold text-[#1B1512]" style={serif}>
                      Items, Sub-Divisions &amp; Tailoring Pricing
                    </h2>
                  </div>
                  <p className="text-xs text-[#8A7968] mt-1">
                    Manage atelier garment items (shown in user pills &amp; outfit selector), create
                    sub-division sections (e.g. Neckline, Sleeves), and assign tailoring fees added
                    directly to customer bills.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGarmentModal(true)}
                    className="px-4 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetGarmentsToFactory}
                    className="px-3.5 py-2 border border-[#5C1A32]/25 text-[#5C1A32] hover:bg-[#5C1A32]/5 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>
              </div>

              {/* Garment Selector Pills / Horizontal Cards */}
              <div className="bg-white p-5 rounded-lg border border-[#5C1A32]/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#8A7968]">
                    Select An Item To Configure Sub-Divisions &amp; Stitching Fees:
                  </span>
                  <span className="text-xs text-[#5C1A32] font-semibold">
                    {garmentsList.length} Items Available to Customers
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {garmentsList.map((g) => {
                    const isSelected = g.id === selectedGarmentId;
                    return (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGarmentId(g.id)}
                        className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#5C1A32] text-white border-[#5C1A32] shadow-sm'
                            : 'bg-[#FAF7F2] hover:bg-white text-[#1B1512] border-[#5C1A32]/15 hover:border-[#5C1A32]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <h4 className="text-sm font-bold truncate">{g.label}</h4>
                          {g.isCustom && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                                isSelected
                                  ? 'bg-white/20 text-[#FAF7F2]'
                                  : 'bg-[#5C1A32]/10 text-[#5C1A32]'
                              }`}
                            >
                              New
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className={isSelected ? 'text-[#E8DFC8]' : 'text-[#8A7968]'}>
                              Base Tailoring:
                            </span>
                            <span className="font-mono font-bold">₹{g.baseTailoringPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isSelected ? 'text-[#E8DFC8]' : 'text-[#8A7968]'}>
                              Meters:
                            </span>
                            <span className="font-mono">{g.defaultMeters}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isSelected ? 'text-[#E8DFC8]' : 'text-[#8A7968]'}>
                              Sub-Divs:
                            </span>
                            <span className="font-bold">{g.sections.length}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGarment(g);
                              setEditGarmentName(g.label);
                              setEditGarmentMeters(String(g.defaultMeters));
                              setEditGarmentBaseTailoring(String(g.baseTailoringPrice));
                            }}
                            className={`p-1 rounded hover:bg-black/10 transition-colors ${
                              isSelected ? 'text-[#FAF7F2]' : 'text-[#5C1A32]'
                            }`}
                            title="Edit Item Details"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGarment(g.id, g.label);
                            }}
                            className={`p-1 rounded hover:bg-black/10 transition-colors ${
                              isSelected ? 'text-rose-200' : 'text-rose-600'
                            }`}
                            title="Delete Item"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sub-Divisions & Options for Selected Item */}
              {selectedGarment && (
                <div className="space-y-6">
                  {/* Item Detail Card */}
                  <div className="bg-white p-5 rounded-lg border border-[#5C1A32]/10 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#1B1512]" style={serif}>
                          {selectedGarment.label} — Sub-Divisions &amp; Styling Options
                        </h3>
                        <span className="text-[10px] bg-[#5C1A32]/10 text-[#5C1A32] font-mono font-bold px-2 py-0.5 rounded">
                          ID: {selectedGarment.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A7968] mt-1">
                        Base Tailoring:{' '}
                        <span className="font-bold text-[#1B1512]">
                          ₹{selectedGarment.baseTailoringPrice}
                        </span>{' '}
                        · Required Meterage:{' '}
                        <span className="font-bold text-[#1B1512]">
                          {selectedGarment.defaultMeters}m
                        </span>{' '}
                        · Measurement Profile:{' '}
                        <span className="font-bold uppercase text-[#5C1A32]">
                          {selectedGarment.measurementProfile || 'blouse'}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddSectionModal(true)}
                      className="px-4 py-2 bg-[#1B1512] hover:bg-[#5C1A32] text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-[#B8935A]" />
                      <span>Add Sub-Division Section</span>
                    </button>
                  </div>

                  {/* Sub-Divisions List */}
                  {selectedGarment.sections.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-lg border border-dashed border-[#5C1A32]/30 space-y-3">
                      <Layers className="h-10 w-10 text-[#B8935A] mx-auto opacity-60" />
                      <h4 className="text-sm font-bold text-[#1B1512]">
                        No Sub-Divisions defined for {selectedGarment.label} yet
                      </h4>
                      <p className="text-xs text-[#8A7968] max-w-md mx-auto">
                        Add sub-division sections like "Neckline Style", "Sleeve Cut", or "Bodice
                        Pattern", then configure options with custom tailoring amounts.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddSectionModal(true)}
                        className="px-4 py-2 bg-[#5C1A32] text-white text-xs font-semibold uppercase tracking-wider rounded"
                      >
                        Create First Sub-Division Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedGarment.sections.map((section, sIdx) => (
                        <div
                          key={section.id}
                          className="bg-white rounded-lg border border-[#5C1A32]/15 shadow-xs overflow-hidden"
                        >
                          {/* Section Header */}
                          <div className="p-4 bg-[#FAF7F2] border-b border-[#5C1A32]/10 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#5C1A32] text-white text-xs font-bold flex items-center justify-center">
                                {sIdx + 1}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-[#1B1512]">
                                  {section.label}
                                </h4>
                                <span className="text-[10px] text-[#8A7968]">
                                  Sub-division ID: {section.id} · {section.options.length}{' '}
                                  Selectable Options
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetSectionIdForOption(section.id);
                                  setShowAddOptionModal(true);
                                }}
                                className="px-3 py-1.5 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Option</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(section.id, section.label)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                                title="Delete Sub-Division Section"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Options Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#FAF7F2]/50 border-b border-neutral-200 text-[#8A7968] font-bold uppercase text-[10px] tracking-wider">
                                  <th className="p-3 w-12 text-center">#</th>
                                  <th className="p-3">Style Option Label</th>
                                  <th className="p-3 w-48">Tailoring Amount (₹)</th>
                                  <th className="p-3">Sub-Options (Dart / Specific Seams)</th>
                                  <th className="p-3 text-right w-28">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {section.options.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-4 text-center text-[#8A7968]">
                                      No options added yet in this sub-division. Click "+ Add
                                      Option" above.
                                    </td>
                                  </tr>
                                ) : (
                                  section.options.map((opt, oIdx) => {
                                    const priceInputKey = `${section.id}:${opt.id}`;
                                    const currentPriceInput =
                                      editingTailoringPrices[priceInputKey] ??
                                      String(opt.tailoringPrice);

                                    return (
                                      <tr
                                        key={opt.id}
                                        className="hover:bg-neutral-50/70 transition-colors"
                                      >
                                        <td className="p-3 text-center text-[#8A7968] font-mono">
                                          {oIdx + 1}
                                        </td>
                                        <td className="p-3">
                                          <div className="font-semibold text-[#1B1512]">
                                            {opt.label}
                                          </div>
                                          <span className="text-[10px] text-[#8A7968] font-mono">
                                            {opt.id}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[#5C1A32] font-bold font-mono">
                                              ₹
                                            </span>
                                            <input
                                              type="number"
                                              min="0"
                                              value={currentPriceInput}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setEditingTailoringPrices((prev) => ({
                                                  ...prev,
                                                  [priceInputKey]: val,
                                                }));
                                              }}
                                              onBlur={() => {
                                                const p = parseFloat(currentPriceInput);
                                                if (
                                                  !isNaN(p) &&
                                                  p >= 0 &&
                                                  p !== opt.tailoringPrice
                                                ) {
                                                  handleUpdateOptionTailoringAmount(
                                                    section.id,
                                                    opt.id,
                                                    Math.round(p),
                                                  );
                                                }
                                              }}
                                              className="w-24 px-2 py-1 border border-[#5C1A32]/25 rounded text-xs font-mono font-bold text-[#5C1A32] focus:outline-none focus:border-[#5C1A32]"
                                            />
                                            {currentPriceInput !== String(opt.tailoringPrice) && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const p = parseFloat(currentPriceInput);
                                                  if (!isNaN(p) && p >= 0) {
                                                    handleUpdateOptionTailoringAmount(
                                                      section.id,
                                                      opt.id,
                                                      Math.round(p),
                                                    );
                                                  }
                                                }}
                                                className="p-1 text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100"
                                                title="Save tailoring amount"
                                              >
                                                <Check className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-3">
                                          <div className="space-y-1.5">
                                            {opt.subOptions && opt.subOptions.length > 0 ? (
                                              <div className="flex flex-wrap gap-1.5">
                                                {opt.subOptions.map((sub) => (
                                                  <span
                                                    key={sub.id}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#5C1A32]/15 text-[#1B1512] text-[11px]"
                                                  >
                                                    <span className="font-medium">{sub.label}</span>
                                                    <span className="font-mono text-[#5C1A32] font-bold">
                                                      ₹{sub.tailoringPrice}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleDeleteSubOption(
                                                          section.id,
                                                          opt.id,
                                                          sub.id,
                                                          sub.label,
                                                        )
                                                      }
                                                      className="text-neutral-400 hover:text-rose-600 ml-0.5"
                                                      title="Delete Sub-Option"
                                                    >
                                                      <X className="h-3 w-3" />
                                                    </button>
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-[11px] text-[#8A7968]">
                                                Single option (no sub-divisions)
                                              </span>
                                            )}

                                            <div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setTargetSectionIdForSub(section.id);
                                                  setTargetOptionIdForSub(opt.id);
                                                  setShowAddSubOptionModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 text-[10px] text-[#5C1A32] hover:underline font-semibold"
                                              >
                                                <Plus className="h-2.5 w-2.5" />
                                                <span>Add Sub-Option Pill</span>
                                              </button>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-3 text-right">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDeleteOption(section.id, opt.id, opt.label)
                                            }
                                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                                            title="Delete Option"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── MODALS FOR ITEMS, SUB-DIVISIONS & TAILORING ─────────────────── */}

      {/* 1. Add Item Modal */}
      {showAddGarmentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#5C1A32]/20 overflow-hidden">
            <div className="p-5 border-b border-[#5C1A32]/10 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#5C1A32]" />
                <h3 className="text-base font-bold text-[#1B1512]" style={serif}>
                  Add New Garment Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGarmentModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGarment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Item Name / Label (Visible on user pills &amp; outfit selector) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurti Set, Western Gown, Sharara Suit"
                  value={newGarmentName}
                  onChange={(e) => setNewGarmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-semibold focus:outline-none focus:border-[#5C1A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                    Default Meters (m) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={newGarmentMeters}
                    onChange={(e) => setNewGarmentMeters(e.target.value)}
                    className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-mono focus:outline-none focus:border-[#5C1A32]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                    Base Tailoring Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={newGarmentBaseTailoring}
                    onChange={(e) => setNewGarmentBaseTailoring(e.target.value)}
                    className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-mono text-[#5C1A32] font-bold focus:outline-none focus:border-[#5C1A32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Measurement Profile
                </label>
                <select
                  value={newGarmentProfile}
                  onChange={(e) =>
                    setNewGarmentProfile(e.target.value as 'blouse' | 'chudi' | 'pant')
                  }
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                >
                  <option value="blouse">
                    Blouse Profile (Upper Chest, Front/Back Neck, Shoulders)
                  </option>
                  <option value="chudi">
                    Chudi / Kurti Profile (Chest, Waist, Height, Slit Open)
                  </option>
                  <option value="pant">
                    Pant / Salwaar Profile (Hip, Seat, Knee, Thigh, Leg Round)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bespoke fitted ensemble tailored to perfection."
                  value={newGarmentDesc}
                  onChange={(e) => setNewGarmentDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                <button
                  type="button"
                  onClick={() => setShowAddGarmentModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Save &amp; Publish Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Garment Modal */}
      {editingGarment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#5C1A32]/20 overflow-hidden">
            <div className="p-5 border-b border-[#5C1A32]/10 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-[#5C1A32]" />
                <h3 className="text-base font-bold text-[#1B1512]" style={serif}>
                  Edit Item: {editingGarment.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGarment(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGarmentEdits} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Item Label
                </label>
                <input
                  type="text"
                  required
                  value={editGarmentName}
                  onChange={(e) => setEditGarmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-semibold focus:outline-none focus:border-[#5C1A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                    Default Meters (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={editGarmentMeters}
                    onChange={(e) => setEditGarmentMeters(e.target.value)}
                    className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                    Base Tailoring Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={editGarmentBaseTailoring}
                    onChange={(e) => setEditGarmentBaseTailoring(e.target.value)}
                    className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-mono text-[#5C1A32] font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                <button
                  type="button"
                  onClick={() => setEditingGarment(null)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Sub-Division Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#5C1A32]/20 overflow-hidden">
            <div className="p-5 border-b border-[#5C1A32]/10 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#5C1A32]" />
                <h3 className="text-base font-bold text-[#1B1512]" style={serif}>
                  Add Sub-Division Section ({selectedGarment?.label})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Sub-Division Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neckline Pattern, Sleeve Style, Bodice Cut"
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-semibold focus:outline-none focus:border-[#5C1A32]"
                />
                <p className="text-[11px] text-[#8A7968] mt-1">
                  This section will appear as a step for customers customizing{' '}
                  {selectedGarment?.label}.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Add Sub-Division
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Style Option Modal */}
      {showAddOptionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#5C1A32]/20 overflow-hidden">
            <div className="p-5 border-b border-[#5C1A32]/10 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-[#5C1A32]" />
                <h3 className="text-base font-bold text-[#1B1512]" style={serif}>
                  Add Style Option &amp; Tailoring Amount
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOptionModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOption} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Style Option Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Princess Cut, Boat Neck, Puff Sleeve, Anarkali Flare"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-semibold focus:outline-none focus:border-[#5C1A32]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Tailoring Amount / Stitching Charge (₹) *
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-[#5C1A32]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 250 (or 0 if included in base)"
                    value={newOptionTailoringPrice}
                    onChange={(e) => setNewOptionTailoringPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-mono font-bold text-[#5C1A32] focus:outline-none focus:border-[#5C1A32]"
                  />
                </div>
                <p className="text-[11px] text-[#8A7968] mt-1">
                  This tailoring fee will be displayed to customers and automatically added to the
                  billing summary.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                <button
                  type="button"
                  onClick={() => setShowAddOptionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Add Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Sub-Option Modal */}
      {showAddSubOptionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#5C1A32]/20 overflow-hidden">
            <div className="p-5 border-b border-[#5C1A32]/10 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-[#5C1A32]" />
                <h3 className="text-base font-bold text-[#1B1512]" style={serif}>
                  Add Sub-Option Pill
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubOptionModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubOption} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Sub-Option Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 Dart, 3 Dart, 4 Dart, Extra Flounce"
                  value={newSubOptionLabel}
                  onChange={(e) => setNewSubOptionLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-semibold focus:outline-none focus:border-[#5C1A32]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#8A7968] mb-1">
                  Sub-Option Tailoring Amount (₹) *
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-[#5C1A32]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 150"
                    value={newSubOptionTailoringPrice}
                    onChange={(e) => setNewSubOptionTailoringPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-[#5C1A32]/25 rounded text-sm font-mono font-bold text-[#5C1A32] focus:outline-none focus:border-[#5C1A32]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#5C1A32]/10">
                <button
                  type="button"
                  onClick={() => setShowAddSubOptionModal(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5C1A32] hover:bg-[#451325] text-white text-xs font-semibold uppercase tracking-wider rounded"
                >
                  Save Sub-Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amazon India Format Tax Invoice Modal */}
      {invoiceOrder && (
        <AmazonInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          order={invoiceOrder}
        />
      )}

      {/* Master Tailor Production Job Card Modal */}
      {jobCardOrder && (
        <AtelierJobCardModal
          isOpen={showJobCardModal}
          onClose={() => {
            setShowJobCardModal(false);
            setJobCardOrder(null);
          }}
          order={jobCardOrder}
        />
      )}
    </div>
  );
}
