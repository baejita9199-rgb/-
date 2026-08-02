"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  highlightDishes,
  menuItems,
  reviewQuotes,
  store,
} from "../data/store";

/* Depth tunnel: scroll position drives a camera along Z through 9 scenes.
   Scene HOLD_SCENE pauses the camera for HOLD scroll-units while the
   horizontal highlights track plays. Engine state lives in refs/locals and
   is written straight to the DOM — never React state — so paint() can run
   at 60fps without re-renders. */

const PERSPECTIVE = 1200;
const HOLD_SCENE = 2;
const HOLD = 2.8;
const DEPTH_MOBILE = 900; // full depth overshoots on short viewports

const sceneLabels = [
  "หน้าแรก",
  "เรื่องราวของร้าน",
  "จานไฮไลต์",
  "จานเด่น",
  "เมนูแนะนำ",
  "บรรยากาศ",
  "ดนตรีสด",
  "รีวิว",
  "ติดต่อเรา",
] as const;

const menuTagClass: Record<string, string> = {
  แนะนำ: "tag-accent",
  ขายดี: "tag-gold",
};

type DepthSiteProps = {
  depth?: number;
  accent?: string;
  showDots?: boolean;
};

function DepthSite({
  depth = 1400,
  accent = "#e96443",
  showDots = true,
}: DepthSiteProps) {
  const scenesRef = useRef<(HTMLElement | null)[]>([]);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const hbarRef = useRef<HTMLDivElement>(null);
  const hcountRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scenes = scenesRef.current.filter(Boolean) as HTMLElement[];
    const dots = dotsRef.current.filter(Boolean) as HTMLButtonElement[];
    const track = trackRef.current;
    const hbar = hbarRef.current;
    const hcount = hcountRef.current;
    const bar = barRef.current;
    const hint = hintRef.current;
    const counter = counterRef.current;
    const label = labelRef.current;
    const cards = track ? Array.from(track.children) : [];
    const N = scenes.length;
    const units = N - 1 + HOLD;
    const scroller = document.scrollingElement || document.documentElement;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 820px)");
    let reduce = mqReduce.matches;
    let liveDepth = mqMobile.matches ? Math.min(depth, DEPTH_MOBILE) : depth;

    let cur = 0;
    let tgt = 0;
    let lastIdx = -1;
    let rafAlive = false;
    let raf = 0;
    let poll = 0;

    const smoothstep = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    const maxScroll = () => scroller.scrollHeight - window.innerHeight;

    const paint = (p: number) => {
      const u = p * units;
      let pos: number;
      let h: number;
      if (u <= HOLD_SCENE) {
        pos = u;
        h = 0;
      } else if (u < HOLD_SCENE + HOLD) {
        pos = HOLD_SCENE;
        h = (u - HOLD_SCENE) / HOLD;
      } else {
        pos = u - HOLD;
        h = 1;
      }

      if (track) {
        const span = Math.max(0, track.scrollWidth - track.clientWidth);
        track.scrollLeft = h * span;
        const n = cards.length;
        if (hbar) {
          hbar.style.transform = `scaleX(${Math.max(1 / n, h * (1 - 1 / n) + 1 / n).toFixed(4)})`;
        }
        if (hcount) {
          const ci = Math.min(n, Math.max(1, Math.round(h * (n - 1)) + 1));
          const txt = `${String(ci).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
          if (hcount.textContent !== txt) hcount.textContent = txt;
        }
      }

      for (let i = 0; i < N; i++) {
        const s = scenes[i];
        const l = pos - i;
        const op = l <= 0 ? smoothstep(-1, -0.3, l) : 1 - smoothstep(0.12, 0.62, l);
        if (op < 0.008) {
          if (s.style.visibility !== "hidden") {
            s.style.visibility = "hidden";
            s.style.opacity = "0";
            s.style.pointerEvents = "none";
          }
          continue;
        }
        // z must stay short of the perspective plane or the scene hits the camera
        const z = Math.max(-2900, Math.min(PERSPECTIVE * 0.85, l * liveDepth));
        const blur = reduce ? 0 : Math.min(9, Math.max(0, Math.abs(l) - 0.14) * 11);
        s.style.visibility = "visible";
        s.style.opacity = op.toFixed(3);
        s.style.filter = blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : "none";
        s.style.transform = `translate(-50%,-50%) translateZ(${z.toFixed(1)}px)`;
        s.style.pointerEvents = Math.abs(l) < 0.34 ? "auto" : "none";
      }

      const idx = Math.min(N - 1, Math.max(0, Math.round(pos)));
      if (idx !== lastIdx) {
        lastIdx = idx;
        dots.forEach((d, i) => {
          d.style.background = i === idx ? accent : "rgba(247,240,227,.28)";
          d.style.transform = i === idx ? "scaleX(1)" : "scaleX(0.42)";
        });
        if (counter) counter.textContent = String(idx + 1).padStart(2, "0");
        if (label) label.textContent = sceneLabels[idx];
      }
      if (bar) bar.style.transform = `scaleY(${Math.max(0.015, p).toFixed(4)})`;
      if (hint) hint.style.opacity = String(Math.max(0, 1 - p * 14));
    };

    const read = () => {
      const max = maxScroll();
      tgt = max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0;
      if (!rafAlive) {
        cur = tgt;
        paint(tgt);
      }
    };

    const tick = () => {
      rafAlive = true;
      const ease = reduce ? 1 : 0.11;
      cur += (tgt - cur) * ease;
      if (Math.abs(tgt - cur) < 0.00004) cur = tgt;
      paint(cur);
      raf = requestAnimationFrame(tick);
    };

    const dotHandlers = dots.map((d, i) => {
      const h = () => {
        const u = i <= HOLD_SCENE ? i : i + HOLD;
        window.scrollTo({ top: (u / units) * maxScroll(), behavior: "smooth" });
      };
      d.addEventListener("click", h);
      return h;
    });

    const arrows = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-hscroll]"),
    );
    const arrowHandlers = arrows.map((b) => {
      const dir = Number(b.getAttribute("data-hscroll"));
      const h = () => {
        const step = ((HOLD / units) * maxScroll()) / Math.max(1, cards.length - 1);
        window.scrollTo({
          top: scroller.scrollTop + dir * step,
          behavior: "smooth",
        });
      };
      b.addEventListener("click", h);
      return h;
    });

    const onReduce = (e: MediaQueryListEvent) => {
      reduce = e.matches;
    };
    const onMobile = (e: MediaQueryListEvent) => {
      liveDepth = e.matches ? Math.min(depth, DEPTH_MOBILE) : depth;
      read();
    };
    mqReduce.addEventListener("change", onReduce);
    mqMobile.addEventListener("change", onMobile);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);

    read();
    cur = tgt;
    paint(cur);
    raf = requestAnimationFrame(tick);

    // throttled/embedded contexts may never grant a rAF frame — poll so the
    // page does not freeze with 8 of 9 scenes hidden
    const fallback = window.setTimeout(() => {
      if (rafAlive) return;
      poll = window.setInterval(() => {
        if (rafAlive) {
          clearInterval(poll);
          return;
        }
        read();
        cur = tgt;
        paint(tgt);
      }, 100);
    }, 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
      clearInterval(poll);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      document.removeEventListener("visibilitychange", onVisibility);
      mqReduce.removeEventListener("change", onReduce);
      mqMobile.removeEventListener("change", onMobile);
      dots.forEach((d, i) => d.removeEventListener("click", dotHandlers[i]));
      arrows.forEach((b, i) => b.removeEventListener("click", arrowHandlers[i]));
    };
  }, [depth, accent]);

  return (
    <div className="root" style={{ "--accent": accent } as CSSProperties}>
      <div className="viewport">
        <div className="stage">
          {/* 01 — หน้าแรก */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[0] = el;
            }}
          >
            <div className="hero-card">
              <img
                src="/images/hero-restaurant.jpg"
                alt="บรรยากาศริมน้ำของตำปูม้าคาเฟ่"
                fetchPriority="high"
              />
              <div className="hero-scrim" aria-hidden="true" />
              <div className="hero-content">
                <div className="hero-top">
                  <div className="hero-kicker">{store.descriptor}</div>
                  <div className="hero-est">EST. {store.address}</div>
                </div>
                <div className="hero-bottom">
                  <h1>{store.name}</h1>
                  <div className="hero-lead-row">
                    <p>
                      ปูม้าสดคลุกน้ำปลาร้ารสนัว กาแฟหอมกรุ่น ริมสายน้ำ
                      และดนตรีสดยามค่ำ
                    </p>
                    <div className="hero-ctas">
                      <a className="btn btn-fill" href={store.phoneHref}>
                        โทรจองโต๊ะ {store.phoneDisplay}
                      </a>
                      <a
                        className="btn btn-line"
                        href={store.maps}
                        target="_blank"
                        rel="noopener"
                      >
                        เส้นทางไปร้าน
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 02 — เรื่องราวของร้าน */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[1] = el;
            }}
          >
            <div className="story-grid">
              <div>
                <div className="kicker">01 — เรื่องราวของร้าน</div>
                <h2 className="h2-std">
                  ริมน้ำ ลมเย็น
                  <br />
                  รสจัดจ้านแบบอีสาน
                </h2>
                <p className="story-p">
                  ตำปูม้าคาเฟ่คือที่ที่ครัวอีสานมาเจอกับคาเฟ่ริมน้ำ
                  เราเลือกปูม้าสดทุกวัน ตำสดต่อจาน
                  แล้วเสิร์ฟใต้ร่มไม้พร้อมกาแฟและเสียงเพลง
                </p>
                <p className="story-p story-p-last">
                  มาคนเดียว มากับครอบครัว หรือมาเป็นกลุ่ม เรามีทั้งโซนในร่ม
                  ที่นั่งกลางแจ้ง และซื้อกลับบ้าน
                </p>
                <div className="stats-row">
                  <div>
                    <div className="stat-num">
                      {store.socialProof.recommended}
                    </div>
                    <div className="stat-label">แนะนำร้านนี้</div>
                  </div>
                  <div>
                    <div className="stat-num stat-gold">
                      {store.socialProof.reviews}
                    </div>
                    <div className="stat-label">รีวิวจากลูกค้า</div>
                  </div>
                  <div>
                    <div className="stat-num stat-cream">
                      {store.socialProof.followers}
                    </div>
                    <div className="stat-label">ผู้ติดตามเพจ</div>
                  </div>
                </div>
              </div>
              <div className="story-media">
                <img
                  src="/images/restaurant-tree.jpg"
                  alt="ร้านใต้ร่มไม้"
                  loading="lazy"
                />
                <img
                  src="/images/coffee-bar.jpg"
                  alt="มุมคอฟฟี่บาร์"
                  loading="lazy"
                />
              </div>
            </div>
          </section>

          {/* 03 — จานไฮไลต์ (scroll-jacked) */}
          <section
            className="scene scene-wide"
            ref={(el) => {
              scenesRef.current[2] = el;
            }}
          >
            <div className="hl-header">
              <div>
                <div className="kicker kicker-16">02 — HIGHLIGHTS</div>
                <h2 className="h2-std h2-tight">จานไฮไลต์ของร้าน</h2>
              </div>
              <div className="hl-controls">
                <div className="hl-hint">เลื่อนเมาส์ลงเพื่อไล่ดูทุกจาน →</div>
                <div className="hl-arrows">
                  <button
                    data-hscroll="-1"
                    type="button"
                    aria-label="เลื่อนไปทางซ้าย"
                  >
                    ←
                  </button>
                  <button
                    data-hscroll="1"
                    type="button"
                    aria-label="เลื่อนไปทางขวา"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="hl-track" ref={trackRef}>
              {highlightDishes.map((dish) => (
                <figure className="hl-card" key={dish.title}>
                  {dish.image ? (
                    <div className="hl-media">
                      <img src={dish.image} alt={dish.title} loading="lazy" />
                      {dish.badge ? (
                        <span className="hl-badge">{dish.badge}</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="hl-media hl-ph">
                      <div className="hl-ph-label">รอรูปจากร้าน</div>
                      <div className="hl-ph-note">
                        {dish.slot}
                        <br />
                        แนวตั้ง 3:4
                      </div>
                    </div>
                  )}
                  <figcaption>
                    <div className="hl-title">{dish.title}</div>
                    <div className="hl-desc">{dish.description}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="hl-progress">
              <div className="hl-count" ref={hcountRef}>
                01 / 09
              </div>
              <div className="hl-bar-rail">
                <div className="hl-bar" ref={hbarRef} />
              </div>
            </div>
          </section>

          {/* 04 — ตำปูม้า (Signature) */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[3] = el;
            }}
          >
            <div className="sig-grid">
              <div className="sig-media">
                <img
                  src="/images/tam-pu-ma.jpg"
                  alt="ตำปูม้า จานเด่นของร้าน"
                  loading="lazy"
                />
                <div className="sig-scrim" aria-hidden="true" />
              </div>
              <div>
                <div className="kicker">03 — SIGNATURE</div>
                <h2 className="h2-sig">ตำปูม้า</h2>
                <p className="sig-p">
                  ปูม้าสด เนื้อหวาน คลุกน้ำปลาร้ารสนัว เผ็ด เปรี้ยว เค็ม หวาน
                  ครบรสแบบอีสานแท้ ตำสดต่อจานทุกครั้ง
                </p>
                <div className="sig-chips">
                  <span className="chip chip-fill">แนะนำ</span>
                  <span className="chip chip-line">เผ็ด</span>
                  <span className="chip chip-line">ปูสดทุกวัน</span>
                </div>
                <div className="sig-note">
                  เสิร์ฟคู่กับข้าวเหนียวและน้ำจิ้มซีฟู้ดของร้าน
                </div>
              </div>
            </div>
          </section>

          {/* 05 — สั่งอะไรดี (Menu) */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[4] = el;
            }}
          >
            <div className="menu-header">
              <div>
                <div className="kicker kicker-16">04 — เมนูแนะนำ</div>
                <h2 className="h2-std h2-tight">สั่งอะไรดี</h2>
              </div>
              <div className="menu-hours">เปิดทุกวัน {store.sampleHours}</div>
            </div>
            <div className="menu-grid">
              {menuItems.map((item, i) => (
                <div
                  className={`menu-row${i >= menuItems.length - 2 ? " menu-row-end" : ""}`}
                  key={item.title}
                >
                  <div className="menu-idx">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="menu-title">{item.title}</div>
                    <div className="menu-desc">{item.description}</div>
                  </div>
                  <div
                    className={`menu-tag ${menuTagClass[item.badges[0]] ?? "tag-dim"}`}
                  >
                    {item.badges[0]}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 06 — นั่งชิลริมสายน้ำ (Gallery) */}
          <section
            className="scene scene-gallery"
            ref={(el) => {
              scenesRef.current[5] = el;
            }}
          >
            <div className="gal-header">
              <div>
                <div className="kicker kicker-16">05 — บรรยากาศ</div>
                <h2 className="h2-std h2-tight">นั่งชิลริมสายน้ำ</h2>
              </div>
              <div className="gal-meta">{store.services.join(" · ")}</div>
            </div>
            <div className="gal-triptych">
              <figure className="gal-fig gal-left">
                <img
                  src="/images/river-view.jpg"
                  alt="วิวสายน้ำข้างร้าน"
                  loading="lazy"
                />
                <figcaption>วิวสายน้ำข้างร้าน</figcaption>
              </figure>
              <figure className="gal-fig gal-center">
                <img
                  src="/images/restaurant-flags.jpg"
                  alt="โต๊ะอาหารกลางแจ้ง"
                  loading="lazy"
                />
                <figcaption>โต๊ะอาหารกลางแจ้ง</figcaption>
              </figure>
              <figure className="gal-fig gal-right">
                <img
                  src="/images/garden-dining.jpg"
                  alt="โซนสวนใต้ร่มไม้"
                  loading="lazy"
                />
                <figcaption>โซนสวนใต้ร่มไม้</figcaption>
              </figure>
            </div>
          </section>

          {/* 07 — ดนตรีสดทุกค่ำคืน */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[6] = el;
            }}
          >
            <div className="music-card">
              <img
                src="/images/music-live.jpg"
                alt="ดนตรีสดช่วงค่ำ"
                loading="lazy"
              />
              <div className="music-scrim" aria-hidden="true" />
              <div className="music-content">
                <div className="kicker kicker-16">06 — LIVE MUSIC</div>
                <h2 className="h2-music">ดนตรีสดทุกค่ำคืน</h2>
                <p>
                  เสียงเพลงเริ่มเมื่อฟ้าเปลี่ยนสี
                  ลมริมน้ำมาพร้อมจานเด็ดและแก้วโปรด
                </p>
                <div className="music-chips">
                  <span>ศุกร์ · 19:00</span>
                  <span>เสาร์ · 19:00</span>
                  <span>อาทิตย์ · 18:30</span>
                </div>
              </div>
            </div>
          </section>

          {/* 08 — รีวิว */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[7] = el;
            }}
          >
            <div className="rev-header">
              <div className="kicker kicker-16">07 — รีวิวจากลูกค้า</div>
              <h2 className="h2-std h2-tight">
                {store.socialProof.recommended} แนะนำร้านนี้
              </h2>
            </div>
            <div className="rev-grid">
              {reviewQuotes.map((quote, i) => (
                <blockquote key={quote.source}>
                  <div
                    className={`rev-quote${i === 1 ? " rev-quote-gold" : i === 2 ? " rev-quote-cream" : ""}`}
                  >
                    ”
                  </div>
                  <p>{quote.text}</p>
                  <footer>{quote.source}</footer>
                </blockquote>
              ))}
            </div>
          </section>

          {/* 09 — ติดต่อ */}
          <section
            className="scene"
            ref={(el) => {
              scenesRef.current[8] = el;
            }}
          >
            <div className="contact">
              <div className="kicker kicker-20">08 — แวะมาหาเรา</div>
              <h2 className="h2-xl">เจอกันริมน้ำ</h2>
              <p className="contact-lead">
                {store.address} · เปิดทุกวัน {store.sampleHours}
              </p>
              <div className="contact-ctas">
                <a className="btn btn-fill btn-lg" href={store.phoneHref}>
                  {store.phoneDisplay}
                </a>
                <a
                  className="btn btn-line btn-lg"
                  href={store.maps}
                  target="_blank"
                  rel="noopener"
                >
                  เปิดแผนที่
                </a>
                <a
                  className="btn btn-line btn-lg"
                  href={store.facebook}
                  target="_blank"
                  rel="noopener"
                >
                  Facebook
                </a>
              </div>
              <div className="contact-table">
                <div className="contact-cell">
                  <div className="contact-label">บริการ</div>
                  <div className="contact-value">
                    {store.services.join(" · ")}
                  </div>
                </div>
                <div className="contact-cell">
                  <div className="contact-label">เวลาเปิด</div>
                  <div className="contact-value">
                    ทุกวัน {store.sampleHours} · ดนตรีสด ศุกร์–อาทิตย์
                  </div>
                </div>
                <div className="contact-cell">
                  <div className="contact-label">ที่อยู่</div>
                  <div className="contact-value">{store.address}</div>
                </div>
              </div>
              <div className="contact-footer">
                {store.name} · {store.descriptor}
              </div>
            </div>
          </section>
        </div>

        <header className="chrome-header">
          <div className="brand">
            <img src="/logo.jpg" alt="โลโก้ตำปูม้าคาเฟ่" />
            <div>
              <div className="brand-name">{store.name}</div>
              <div className="brand-sub">RIVER · MUSIC · COFFEE</div>
            </div>
          </div>
          <a className="header-phone" href={store.phoneHref}>
            {store.phoneDisplay}
          </a>
        </header>

        {showDots ? (
          <nav className="dot-rail" aria-label="นำทางไปยังแต่ละส่วน">
            {sceneLabels.map((name, i) => (
              <button
                key={name}
                type="button"
                aria-label={`ไปที่ ${name}`}
                ref={(el) => {
                  dotsRef.current[i] = el;
                }}
              />
            ))}
          </nav>
        ) : null}

        <div className="scene-counter" aria-hidden="true">
          <div className="counter-num" ref={counterRef}>
            01
          </div>
          <div className="counter-meta">
            <div className="counter-label" ref={labelRef}>
              หน้าแรก
            </div>
            <div className="counter-total">/ 09</div>
          </div>
        </div>

        <div className="scroll-hint" ref={hintRef} aria-hidden="true">
          <div className="hint-text">เลื่อนเพื่อเข้าใกล้</div>
          <div className="hint-line" />
        </div>

        <div className="progress-rail" aria-hidden="true">
          <div className="progress-bar" ref={barRef} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <DepthSite />;
}
