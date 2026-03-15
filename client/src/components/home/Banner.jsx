import React, { useEffect } from 'react';

// carousel banner（非 LCP）
import carousel1DesktopJpg from '../../assets/carousel-banner-1-desktop.png';
import carousel1DesktopWebp from '../../assets/carousel-banner-1-desktop.webp';
import carousel1MobileJpg from '../../assets/carousel-banner-1-mobile.png';
import carousel1MobileWebp from '../../assets/carousel-banner-1-mobile.webp';

// 依使用者偏好減少動效，自動關閉 autoplay
const autoPlayAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)')
  .matches;

// slides 設定
const slides = [
  {
    id: 0,
    type: 'hero',
    title: '全年投入學習，享受 20% 優惠',
    description:
      '以額外優惠價格，無限存取我們在科技、商務等多個領域中最受好評的課程。適用相關條款。',
    cta: '現享優惠',
    ctaTo: '/enroll',
    lazy: false,
    interval: 5000,
  },
  {
    id: 1,
    type: 'carousel',
    desktopSrc: carousel1DesktopJpg,
    desktopWebp: carousel1DesktopWebp,
    mobileSrc: carousel1MobileJpg,
    mobileWebp: carousel1MobileWebp,
    title: '彈指之間，即可獲得知識',
    description:
      '向現實世界中全球各地的專家學習，購買 $320 起的課程，還剩一天！',
    lazy: true,
    interval: 4000,
  },
];

const BannerSlide = ({
  index,
  total,
  type,
  desktopSrc,
  desktopWebp,
  mobileSrc,
  mobileWebp,
  title,
  description,
  cta,
  ctaTo,
  isActive,
  lazy,
  interval,
}) => (
  <div
    className={`carousel-item ${isActive ? 'active' : ''}`}
    role="group"
    aria-roledescription="slide"
    aria-label={`第 ${index + 1} 張，共 ${total} 張`}
    aria-hidden={!isActive}
    data-bs-interval={autoPlayAllowed ? interval : undefined}
  >
    <div className="banner-container">
      <div className="image-container w-100">
        {type === 'hero' ? (
          <picture>
            {/* Mobile Image (max-width: 767px) */}
            <source
              media="(max-width: 767px)"
              srcSet="/assets/home-hero-mobile.webp"
              type="image/webp"
            />
            <source
              media="(max-width: 767px)"
              srcSet="/assets/home-hero-mobile.png"
              type="image/png"
            />
            {/* Desktop Image (Default/min-width: 768px) */}
            <source srcSet="/assets/home-hero-desktop.webp" type="image/webp" />
            <img
              className="banner-img"
              alt={title}
              width={1340}
              height={400}
              src="/assets/home-hero-desktop.png"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
        ) : (
          <picture>
            {/* Mobile Image */}
            <source
              media="(max-width: 767px)"
              srcSet={mobileWebp}
              type="image/webp"
            />
            <source media="(max-width: 767px)" srcSet={mobileSrc} />
            {/* Desktop Image */}
            <source srcSet={desktopWebp} type="image/webp" />
            <img
              className="banner-img"
              alt={title}
              src={desktopSrc}
              loading="lazy"
            />
          </picture>
        )}
      </div>

      <div className="text-container bg-white border p-4">
        <h1 className="h2 fw-bold mb-2">{title}</h1>
        {description && <p className="mb-3">{description}</p>}
        {cta && ctaTo && (
          <a
            className="banner-btn-purple"
            href={ctaTo}
            onClick={(e) => e.stopPropagation()}
            aria-label={cta}
          >
            {cta}
          </a>
        )}
      </div>
    </div>
  </div>
);

const Banner = () => {
  useEffect(() => {
    const el = document.getElementById('homeBannerCarousel');
    if (!el) return;

    const carousel =
      window.bootstrap?.Carousel.getInstance(el) ||
      new window.bootstrap.Carousel(el, {
        interval: autoPlayAllowed ? 4500 : false,
        ride: autoPlayAllowed ? 'carousel' : false,
        pause: 'hover',
        touch: true,
        keyboard: true,
      });

    const stopOnInteraction = () => carousel.pause();
    const controls = el.querySelectorAll(
      '.carousel-control-prev, .carousel-control-next, .carousel-indicators button'
    );
    controls.forEach((btn) => btn.addEventListener('click', stopOnInteraction));

    return () => {
      controls.forEach((btn) =>
        btn.removeEventListener('click', stopOnInteraction)
      );
    };
  }, []);

  return (
    <section aria-label="首頁促銷與主題橫幅" aria-roledescription="carousel">
      <div
        id="homeBannerCarousel"
        className="carousel slide banner-position"
        data-bs-ride={autoPlayAllowed ? 'carousel' : undefined}
        data-bs-pause="hover"
        data-bs-touch="true"
        data-bs-keyboard="true"
      >
        {/* indicators */}
        <div className="carousel-indicators">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target="#homeBannerCarousel"
              data-bs-slide-to={idx}
              className={idx === 0 ? 'active' : ''}
              aria-current={idx === 0 ? 'true' : undefined}
              aria-label={`前往第 ${idx + 1} 張`}
            />
          ))}
        </div>

        <div className="carousel-inner">
          {slides.map((s, idx) => (
            <BannerSlide
              key={s.id}
              {...s}
              index={idx}
              total={slides.length}
              isActive={idx === 0}
            />
          ))}
        </div>

        {/* controls（保留） */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#homeBannerCarousel"
          data-bs-slide="prev"
          aria-label="上一張"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#homeBannerCarousel"
          data-bs-slide="next"
          aria-label="下一張"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </section>
  );
};

export default Banner;
