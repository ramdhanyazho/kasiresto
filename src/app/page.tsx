'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { formatIDR } from '@/lib/format';
import type { MenuItem, OrderWithItems, Table } from '@/lib/types';

type DashboardData = {
  menuItems: MenuItem[];
  tables: Table[];
  orders: OrderWithItems[];
  summary: {
    openOrders: number;
    revenueToday: number;
    menuCount: number;
    availableTables: number;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const dineOptions = [
  { key: 'dine-in', label: 'Dine In', helper: 'Enjoy your meal at the table' },
  { key: 'pickup', label: 'Pick Up', helper: 'We will prepare it for you' },
  { key: 'delivery', label: 'Delivery', helper: 'Send to your address' }
] as const;

type DineOption = (typeof dineOptions)[number]['key'];

const fallbackDescriptions = [
  'Topping premium dengan rasa khas.',
  'Hidangan hangat yang cocok untuk makan siang.',
  'Porsi cukup untuk berbagi dan nikmati bersama.',
  'Rasa gurih seimbang, favorit pelanggan kami.'
];

const fallbackThumb =
  'https://images.unsplash.com/photo-1604908177520-4025a7cd0cbb?auto=format&fit=crop&w=400&q=80';

export default function Page() {
  const { data, isLoading } = useSWR<DashboardData>('/api/dashboard', fetcher, {
    refreshInterval: 12_000
  });

  const [dineOption, setDineOption] = useState<DineOption>('dine-in');
  const [tableNumber, setTableNumber] = useState('14');
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Best Choice');
  const [cart, setCart] = useState<Record<number, number>>({});

  const categories = useMemo(() => {
    const unique = new Set<string>();
    (data?.menuItems ?? []).forEach((item) => unique.add(item.category));
    return ['Best Choice', ...Array.from(unique)];
  }, [data?.menuItems]);

  const menuByCategory = useMemo(() => {
    if (!data?.menuItems) return [];
    if (selectedCategory === 'Best Choice') {
      return data.menuItems.slice(0, 8);
    }
    return data.menuItems.filter((item) => item.category === selectedCategory);
  }, [data?.menuItems, selectedCategory]);

  const getDescription = (index: number, category: string) => {
    const base = fallbackDescriptions[index % fallbackDescriptions.length];
    const label = category || 'Menu';
    return `${label} spesial kami. ${base}`;
  };

  const addToCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = data?.menuItems.find((menu) => menu.id === Number(id));
    return sum + (item?.price ?? 0) * qty;
  }, 0);

  const renderMenuCards = () => {
    if (isLoading) {
      return (
        <div className="menu-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div className="menu-card skeleton" key={idx} />
          ))}
        </div>
      );
    }

    if (!menuByCategory.length) {
      return <p className="muted">Belum ada menu pada kategori ini.</p>;
    }

    return (
      <div className="menu-grid">
        {menuByCategory.map((item, index) => {
          const quantity = cart[item.id] ?? 0;
          return (
            <div className="menu-card" key={item.id}>
              <div
                className="menu-thumb"
                style={{ backgroundImage: `url(${item.photo_url || fallbackThumb})` }}
              />
              <div className="menu-body">
                <div className="menu-label">{item.category}</div>
                <h4>{item.name}</h4>
                <p>{getDescription(index, item.category)}</p>
                <div className="menu-actions">
                  <div className="price">{formatIDR(item.price)}</div>
                  <button className="ghost-btn" onClick={() => addToCart(item.id)}>
                    {quantity ? `Add (${quantity})` : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="hero">
        <div className="hero-image" />
        <div className="hero-gradient" />
        <div className="hero-top">
          <div className="icon-btn">←</div>
          <div className="pill light">EN</div>
        </div>
        <div className="restaurant-card">
          <div className="restaurant-cover" />
          <div className="restaurant-meta">
            <h3>NoodleMan</h3>
            <p className="muted">Open today, 11:00-21:00</p>
          </div>
          <div className="icon-btn">›</div>
        </div>
      </div>

      <div className="content">
        <div className="how-card">
          <h4>How to use ESB Order</h4>
          <div className="how-steps">
            <div className="step">
              <div className="step-icon">🛍️</div>
              <span>Order</span>
            </div>
            <span className="step-arrow">→</span>
            <div className="step">
              <div className="step-icon">💳</div>
              <span>Pay</span>
            </div>
            <span className="step-arrow">→</span>
            <div className="step">
              <div className="step-icon">🍜</div>
              <span>Eat</span>
            </div>
          </div>
        </div>

        <div className="card prompt-card">
          <div>
            <p className="muted">How would you like to eat today?</p>
            <h4>Choose your preference</h4>
          </div>
          <div className="prompt-options">
            {dineOptions.map((option) => (
              <button
                key={option.key}
                className={`option-btn ${dineOption === option.key ? 'active' : ''}`}
                onClick={() => {
                  setDineOption(option.key);
                  if (option.key === 'dine-in') {
                    setShowTableModal(true);
                  }
                }}
              >
                <div>
                  <strong>{option.label}</strong>
                  <p className="muted">{option.helper}</p>
                </div>
                <span>›</span>
              </button>
            ))}
          </div>
        </div>

        {dineOption === 'dine-in' && (
          <div className="info-banner">
            <span>Table Number: {tableNumber}</span>
            <button className="link" onClick={() => setShowTableModal(true)}>
              Change
            </button>
          </div>
        )}

        <div className="alert">
          <div className="dot" /> Spend, get points & redeem voucher
          <button className="link">Click here!</button>
        </div>

        <div className="category-bar">
          <div className="category-scroll">
            {categories.map((category) => (
              <button
                key={category}
                className={`tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={() => setShowCategoryModal(true)}>
            ☰
          </button>
        </div>

        <div className="section-heading">
          <p className="muted">Menu</p>
          <h4>{selectedCategory}</h4>
        </div>

        {renderMenuCards()}
      </div>

      {showTableModal && (
        <div className="backdrop" onClick={() => setShowTableModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="muted">NoodleMan</p>
                <h4>Dine In</h4>
              </div>
              <button className="icon-btn" onClick={() => setShowTableModal(false)}>
                ✕
              </button>
            </div>
            <label className="input-label" htmlFor="table-number">
              Table Number*
            </label>
            <input
              id="table-number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="input"
              placeholder="Enter your table number"
            />
            <button className="primary-btn" onClick={() => setShowTableModal(false)} disabled={!tableNumber.trim()}>
              Save
            </button>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="backdrop" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h4>Category Item</h4>
              <button className="icon-btn" onClick={() => setShowCategoryModal(false)}>
                ✕
              </button>
            </div>
            <div className="category-list">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setShowCategoryModal(false);
                  }}
                >
                  <span>{category}</span>
                  {selectedCategory === category && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div className="cart-bar">
          <div>
            <strong>{totalItems} item{totalItems > 1 ? 's' : ''}</strong>
            <p className="muted">Estimated total {formatIDR(totalPrice)}</p>
          </div>
          <button className="primary-btn">View Order</button>
        </div>
      )}
    </div>
  );
}
