"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  galleryItems,
  menuItems,
  sampleReviews,
  store,
} from "../data/store";

type MenuFilter = "all" | "signature" | "seafood" | "drinks";

const filters: { key: MenuFilter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "signature", label: "อาหารแนะนำ" },
  { key: "seafood", label: "อาหารทะเล" },
  { key: "drinks", label: "เครื่องดื่ม" },
];

const navItems = [
  ["หน้าแรก", "#top"],
  ["เรื่องราวของร้าน", "#story"],
  ["เมนูแนะนำ", "#menu"],
  ["บรรยากาศ", "#gallery"],
  ["รีวิว", "#reviews"],
  ["ติดต่อเรา", "#contact"],
] as const;

export default function Home() {
  const [filter, setFilter] = useState<MenuFilter>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const galleryWrap = useRef<HTMLDivElement>(null);
  const gallerySticky = useRef<HTMLDivElement>(null);
  const galleryTrack = useRef<HTMLDivElement>(null);
  const galleryProgress = useRef<HTMLDivElement>(null);

  const visibleMenu = useMemo(
    () =>
      filter === "all"
        ? menuItems
        : menuItems.filter((item) =>
            (item.categories as readonly string[]).includes(filter),
          ),
    [filter],
  );

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || lightbox !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, lightbox]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setLightbox(null);
      }
      if (lightbox !== null && event.key === "ArrowRight") {
        setLightbox((lightbox + 1) % galleryItems.length);
      }
      if (lightbox !== null && event.key === "ArrowLeft") {
        setLightbox(
          (lightbox - 1 + galleryItems.length) % galleryItems.length,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let galleryOffset = 0;
    let galleryDistance = 0;
    let galleryFrame = 0;

    const revealObserver = reduceMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver?.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
        );

    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => revealObserver?.observe(element));

    const onScroll = () => {
      const scrollY = window.scrollY;
      document.documentElement.classList.toggle("nav-scrolled", scrollY > 40);

      if (!reduceMotion) {
        const vh = Math.max(window.innerHeight, 1);
        const p = Math.max(0, Math.min(1, scrollY / vh));
        document.documentElement.style.setProperty(
          "--hero-frame-scale",
          String(1 - 0.09 * p),
        );
        document.documentElement.style.setProperty(
          "--hero-media-scale",
          String(1 + 0.1 * p),
        );
        document.documentElement.style.setProperty(
          "--hero-radius",
          `${p * 40}px`,
        );
        document.documentElement.style.setProperty(
          "--hero-text-y",
          `${p * 110}px`,
        );
        document.documentElement.style.setProperty(
          "--hero-text-opacity",
          String(Math.max(0, 1 - p * 1.35)),
        );

        const cine = document.querySelector<HTMLElement>(".cinematic-frame");
        if (cine) {
          const rect = cine.getBoundingClientRect();
          const q = Math.max(
            0,
            Math.min(1, (vh - rect.top) / (vh + rect.height)),
          );
          const bell = 1 - Math.abs(2 * q - 1);
          const eased = bell * bell * (3 - 2 * bell);
          cine.style.setProperty("--cine-scale", String(0.84 + 0.16 * eased));
          cine.style.setProperty("--cine-radius", `${34 - 30 * eased}px`);
        }
      }

      const wrap = galleryWrap.current;
      const track = galleryTrack.current;
      const progress = galleryProgress.current;
      if (!wrap || !track || !progress) return;

      const desktop = window.innerWidth >= 1080;

      if (!desktop || reduceMotion) {
        const max = track.scrollWidth - wrap.clientWidth;
        progress.style.width = `${
          max > 0 ? (wrap.scrollLeft / max) * 100 : 0
        }%`;
        if (progress.parentElement) {
          progress.parentElement.style.opacity = "1";
        }
        return;
      }
    };

    const paintGallery = () => {
      const track = galleryTrack.current;
      const progress = galleryProgress.current;
      if (!track || !progress) return;
      const amount =
        galleryDistance > 0 ? galleryOffset / galleryDistance : 0;
      track.style.transform = `translate3d(${-galleryOffset}px, 0, 0)`;
      progress.style.width = `${amount * 100}%`;
    };

    const onGalleryWheel = (event: WheelEvent) => {
      if (window.innerWidth < 1080 || reduceMotion || galleryDistance <= 0) {
        return;
      }

      const rawDelta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? rawDelta * 24
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? rawDelta * window.innerHeight
            : rawDelta;
      const next = Math.max(
        0,
        Math.min(galleryDistance, galleryOffset + delta),
      );

      if (next === galleryOffset) return;

      event.preventDefault();
      galleryOffset = next;
      window.cancelAnimationFrame(galleryFrame);
      galleryFrame = window.requestAnimationFrame(paintGallery);
    };

    const layoutGallery = () => {
      const wrap = galleryWrap.current;
      const sticky = gallerySticky.current;
      const track = galleryTrack.current;
      if (!wrap || !sticky || !track) return;
      const desktop = window.innerWidth >= 1080;
      if (desktop && !reduceMotion) {
        const previousProgress =
          galleryDistance > 0 ? galleryOffset / galleryDistance : 0;
        galleryDistance = Math.max(
          0,
          track.scrollWidth - sticky.clientWidth + 48,
        );
        galleryOffset = galleryDistance * previousProgress;
        wrap.style.height = "";
        paintGallery();
      } else {
        galleryDistance = 0;
        galleryOffset = 0;
        wrap.style.height = "";
        track.style.transform = "";
      }
      onScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layoutGallery);
    galleryWrap.current?.addEventListener("scroll", onScroll, {
      passive: true,
    });
    gallerySticky.current?.addEventListener("wheel", onGalleryWheel, {
      passive: false,
    });
    const timer = window.setTimeout(layoutGallery, 150);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(galleryFrame);
      revealObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layoutGallery);
      galleryWrap.current?.removeEventListener("scroll", onScroll);
      gallerySticky.current?.removeEventListener("wheel", onGalleryWheel);
    };
  }, []);

  const stepLightbox = (direction: number) => {
    setLightbox((current) => {
      if (current === null) return null;
      return (
        (current + direction + galleryItems.length) % galleryItems.length
      );
    });
  };

  return (
    <main>
      <header className="site-nav" aria-label="เมนูหลัก">
        <a href="#top" className="brand" aria-label="ตำปูม้าคาเฟ่ หน้าแรก">
          <img src="/logo.jpg" alt="" className="brand-logo" />
          <span>
            <strong>{store.name}</strong>
            <small>{store.descriptor}</small>
          </span>
        </a>
        <nav className="desktop-nav">
          {navItems.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a
            className="button button-outline desktop-action"
            href={store.maps}
            target="_blank"
            rel="noreferrer"
          >
            เปิดแผนที่
          </a>
          <a className="button button-coral call-action" href={store.phoneHref}>
            โทรหาร้าน
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label="เปิดเมนู"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="เมนูนำทาง"
        >
          <button
            className="mobile-close"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="ปิดเมนู"
          >
            ×
          </button>
          <div className="mobile-brand">
            <img src="/logo.jpg" alt="" />
            <span>{store.name}</span>
          </div>
          <nav>
            {navItems.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
              >
                {label}
                <span>↗</span>
              </a>
            ))}
          </nav>
          <div className="mobile-menu-actions">
            <a className="button button-coral" href={store.phoneHref}>
              โทร {store.phoneDisplay}
            </a>
            <a
              className="button button-outline"
              href={store.maps}
              target="_blank"
              rel="noreferrer"
            >
              เปิดแผนที่
            </a>
          </div>
        </div>
      )}

      <section id="top" className="hero">
        <div className="hero-frame">
          <div className="hero-media">
            <img
              src="/images/hero-restaurant.jpg"
              alt="บรรยากาศร้านตำปูม้าคาเฟ่"
              className="hero-photo"
            />
          </div>
          <div className="hero-scrim" />
        </div>
        <div className="hero-copy">
          <p className="kicker kicker-gold">
            <span />
            {store.address} · ริมสายน้ำ
          </p>
          <h1>{store.name}</h1>
          <p className="hero-lead">
            อาหารอร่อย กาแฟดี ริมสายน้ำ
            <br />
            พร้อมเสียงดนตรี
          </p>
          <div className="hero-buttons">
            <a className="button button-coral button-large" href="#menu">
              ดูเมนูแนะนำ <span>↓</span>
            </a>
            <a
              className="button button-outline button-large"
              href={store.maps}
              target="_blank"
              rel="noreferrer"
            >
              เดินทางมาที่ร้าน
            </a>
          </div>
          <a className="scroll-cue" href="#story">
            เลื่อนลงเพื่อดูต่อ <span>↓</span>
          </a>
        </div>
      </section>

      <section id="story" className="section story-section">
        <div className="story-copy">
          <p className="kicker" data-reveal>
            SIGNATURE EXPERIENCE
          </p>
          <h2 data-reveal>
            อาหาร ริมน้ำ
            <br />
            และเสียงดนตรี
          </h2>
          <p data-reveal>
            ร้านอาหารและคาเฟ่ที่รวมความสดของอาหารทะเล รสแซ่บแบบอีสาน
            และบรรยากาศสบายริมสายน้ำไว้ในที่เดียว
          </p>
          <p data-reveal>
            แวะมานั่งกินข้าว จิบกาแฟ รับลมเย็น
            แล้วปล่อยให้เสียงดนตรีเติมเต็มมื้อพิเศษของคุณ
          </p>
          <div className="stats" data-reveal>
            <div>
              <strong>{store.socialProof.recommended}</strong>
              <span>แนะนำร้าน</span>
            </div>
            <div>
              <strong>{store.socialProof.reviews}</strong>
              <span>รีวิวบน Facebook</span>
            </div>
            <div>
              <strong>{store.socialProof.followers}</strong>
              <span>ผู้ติดตาม</span>
            </div>
          </div>
        </div>
        <div className="story-collage" aria-label="ช่องสำหรับภาพบรรยากาศร้าน">
          <img
            className="collage-photo collage-main"
            src="/images/restaurant-flags.jpg"
            alt="บรรยากาศโซนกลางแจ้งของร้าน"
            data-reveal
          />
          <img
            className="collage-photo collage-square"
            src="/images/restaurant-tree.jpg"
            alt="โต๊ะอาหารใต้ต้นไม้ใหญ่"
            data-reveal
          />
          <img
            className="collage-photo collage-small"
            src="/images/tam-pu-ma.jpg"
            alt="ตำปูม้าของร้าน"
            data-reveal
          />
        </div>
      </section>

      <section id="menu" className="section menu-section">
        <div className="section-heading menu-heading">
          <div>
            <p className="kicker kicker-gold" data-reveal>
              เมนูแนะนำ
            </p>
            <h2 data-reveal>
              สด แซ่บ ถึงรส
              <br />
              ทุกจาน
            </h2>
          </div>
          <p data-reveal>
            เลือกความอร่อยที่ชอบ แล้วมาลองของจริงที่ร้าน
          </p>
        </div>
        <div className="filters" aria-label="ตัวกรองเมนู">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              className={filter === item.key ? "active" : ""}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="menu-rail">
          {visibleMenu.map((item, index) => (
            <article className="menu-card" key={item.title}>
              <div
                className={`menu-photo photo-tone-${index % 4} ${
                  item.image ? "has-image" : ""
                }`}
              >
                {item.image && <img src={item.image} alt={item.title} />}
                <div className="badges">
                  {item.badges.map((badge) => (
                    <span key={badge}>{badge}</span>
                  ))}
                </div>
                {!item.image && <span>{item.slot}</span>}
              </div>
              <div className="menu-card-body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <strong>สอบถามราคาที่ร้าน</strong>
              </div>
            </article>
          ))}
        </div>
        <p className="sample-note">
          * ชื่อเมนู รายละเอียด และราคาเป็นข้อมูลตัวอย่าง
          กรุณายืนยันกับทางร้าน
        </p>
      </section>

      <section className="cinematic-section">
        <div className="cinematic-frame">
          <img
            src="/images/restaurant-dining.jpg"
            alt="บรรยากาศรับประทานอาหารริมน้ำ"
          />
          <strong>สด แซ่บ ถึงรส</strong>
        </div>
      </section>

      <section id="gallery" className="gallery-section">
        <div className="gallery-head section-heading">
          <div>
            <p className="kicker">บรรยากาศร้าน</p>
            <h2>
              นั่งสบาย
              <br />
              ริมสายน้ำ
            </h2>
          </div>
          <p>เลื่อนชมบรรยากาศ แล้วเลือกมุมโปรดของคุณ</p>
        </div>
        <div className="gallery-wrap" ref={galleryWrap}>
          <div className="gallery-sticky" ref={gallerySticky}>
            <div className="gallery-track" ref={galleryTrack}>
              {galleryItems.map((item, index) => (
                <button
                  className={`gallery-card gallery-card-${index + 1}`}
                  type="button"
                  key={item.caption}
                  onClick={() => setLightbox(index)}
                  aria-label={`เปิดภาพ ${item.caption}`}
                >
                  <img src={item.src} alt="" />
                  <strong>{item.caption}</strong>
                  <span className="zoom-mark">＋</span>
                </button>
              ))}
            </div>
            <div className="gallery-progress">
              <span ref={galleryProgress} />
            </div>
          </div>
        </div>
      </section>

      <section id="music" className="section music-section">
        <div className="music-overlay" />
        <div className="music-content">
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 26 }).map((_, index) => (
              <span
                key={index}
                style={{ animationDelay: `${index * 0.09}s` }}
              />
            ))}
          </div>
          <p className="kicker kicker-gold" data-reveal>
            LIVE MUSIC
          </p>
          <h2 data-reveal>
            อาหารดีขึ้น
            <br />
            เมื่อมีเพลงที่ใช่
          </h2>
          <p data-reveal>
            พบกับดนตรีสดในบรรยากาศเป็นกันเอง
            เสียงเพลงเบา ๆ เคล้าลมริมน้ำ
          </p>
          <div className="music-schedule" data-reveal>
            <span>ศุกร์ – อาทิตย์</span>
            <strong>19:00 น. เป็นต้นไป</strong>
            <small>* ตารางตัวอย่าง กรุณาสอบถามร้านก่อนเดินทาง</small>
          </div>
          <a className="button button-coral button-large" href={store.phoneHref}>
            สอบถามรอบดนตรี
          </a>
        </div>
      </section>

      <section id="reviews" className="section reviews-section">
        <div className="reviews-intro">
          <p className="kicker kicker-gold">เสียงจากลูกค้า</p>
          <h2>
            ความอร่อย
            <br />
            ที่อยากบอกต่อ
          </h2>
          <div className="rating-orbit">
            <strong>{store.socialProof.recommended}</strong>
            <span>แนะนำร้าน</span>
          </div>
        </div>
        <div className="reviews-viewport">
          <div className="reviews-track">
            {[...sampleReviews, ...sampleReviews].map((review, index) => (
              <article key={`${review}-${index}`}>
                <span className="quote-mark">“</span>
                <p>{review}</p>
                <small>รีวิวตัวอย่าง {1 + (index % sampleReviews.length)}</small>
              </article>
            ))}
          </div>
        </div>
        <p className="sample-note review-note">
          * ข้อความทั้งหมดเป็นตัวอย่างจัดวาง
          รอเปลี่ยนเป็นรีวิวจริงที่ได้รับอนุญาต
        </p>
      </section>

      <section id="contact" className="section contact-section">
        <div className="contact-copy">
          <p className="kicker">แวะมาหาเรา</p>
          <h2>
            มื้ออร่อย
            <br />
            รอคุณอยู่
          </h2>
          <p className="contact-address">{store.address}</p>
          <div className="contact-list">
            <div>
              <span>โทรศัพท์</span>
              <a href={store.phoneHref}>{store.phoneDisplay}</a>
            </div>
            <div>
              <span>เวลาเปิดตัวอย่าง</span>
              <strong>{store.sampleHours}</strong>
            </div>
            <div>
              <span>บริการ</span>
              <strong>{store.services.join(" · ")}</strong>
            </div>
          </div>
          <div className="contact-actions">
            <a
              className="button button-river button-large"
              href={store.maps}
              target="_blank"
              rel="noreferrer"
            >
              เปิดเส้นทางใน Google Maps ↗
            </a>
            <a
              className="button button-facebook button-large"
              href={store.facebook}
              target="_blank"
              rel="noreferrer"
            >
              ไปที่ Facebook ของร้าน ↗
            </a>
          </div>
          <p className="sample-note dark-note">
            * เวลาเปิด–ปิดและพิกัดเป็นข้อมูลตัวอย่าง กรุณาตรวจสอบกับร้าน
          </p>
        </div>
        <div className="map-card">
          <iframe
            title="แผนที่ตำปูม้าคาเฟ่"
            loading="lazy"
            src="https://www.google.com/maps?q=ตำปูม้าคาเฟ่+เสาธงเก่า&output=embed"
          />
          <div className="map-label">
            <img src="/logo.jpg" alt="" />
            <div>
              <strong>{store.name}</strong>
              <span>{store.address}</span>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <a href="#top" className="footer-brand">
          <img src="/logo.jpg" alt="" />
          <span>
            <strong>{store.name}</strong>
            <small>{store.descriptor}</small>
          </span>
        </a>
        <div className="footer-links">
          <a href={store.phoneHref}>โทร {store.phoneDisplay}</a>
          <a href={store.maps} target="_blank" rel="noreferrer">
            แผนที่
          </a>
          <a href={store.facebook} target="_blank" rel="noreferrer">
            Facebook
          </a>
        </div>
        <p>© {new Date().getFullYear()} ตำปูม้าคาเฟ่</p>
      </footer>

      <div className="mobile-bottom-bar">
        <a href={store.phoneHref}>
          <span>☎</span>
          โทรหาร้าน
        </a>
        <a href={store.maps} target="_blank" rel="noreferrer">
          <span>⌖</span>
          แผนที่
        </a>
        <a href={store.facebook} target="_blank" rel="noreferrer">
          <span>f</span>
          Facebook
        </a>
      </div>

      {lightbox !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="ภาพขนาดใหญ่"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightbox(null);
          }}
        >
          <button
            className="lightbox-close"
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="ปิดภาพ"
          >
            ×
          </button>
          <img
            className="lightbox-photo"
            src={galleryItems[lightbox].src}
            alt={galleryItems[lightbox].caption}
          />
          <div className="lightbox-controls">
            <button
              type="button"
              aria-label="ภาพก่อนหน้า"
              onClick={() => stepLightbox(-1)}
            >
              ←
            </button>
            <div>
              <strong>{galleryItems[lightbox].caption}</strong>
              <span>
                {lightbox + 1} / {galleryItems.length}
              </span>
            </div>
            <button
              type="button"
              aria-label="ภาพถัดไป"
              onClick={() => stepLightbox(1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
