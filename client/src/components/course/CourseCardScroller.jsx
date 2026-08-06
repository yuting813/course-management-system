import React, { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import CourseService from '../../services/course.service';
import CourseCard from './CourseCard';
import CourseHoverPopover from './CourseHoverPopover';
import ScrollButton from './ScrollButton';
import CourseSkeleton from './CourseSkeleton';

const HOVER_CLOSE_GRACE_MS = 140;
const POPOVER_EXIT_ANIMATION_MS = 120;

const CourseCardScroller = ({ showAlert, currentUser }) => {
  const [courses, setCourses] = useState([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [isPopoverClosing, setIsPopoverClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const closeGraceTimerRef = useRef(null);
  const exitAnimationTimerRef = useRef(null);
  const isPopoverOpen = Boolean(hoveredCourse && anchorRect);

  const clearCloseTimer = useCallback(() => {
    if (closeGraceTimerRef.current) {
      clearTimeout(closeGraceTimerRef.current);
      closeGraceTimerRef.current = null;
    }
    if (exitAnimationTimerRef.current) {
      clearTimeout(exitAnimationTimerRef.current);
      exitAnimationTimerRef.current = null;
    }
    setIsPopoverClosing(false);
  }, []);

  const closePopover = useCallback(() => {
    clearCloseTimer();
    setHoveredCourse(null);
    setAnchorRect(null);
    setIsPopoverClosing(false);
  }, [clearCloseTimer]);

  const closePopoverImmediately = useCallback(() => {
    clearCloseTimer();
    flushSync(() => {
      setHoveredCourse(null);
      setAnchorRect(null);
      setIsPopoverClosing(false);
    });
  }, [clearCloseTimer]);

  const scheduleClosePopover = useCallback(() => {
    clearCloseTimer();
    closeGraceTimerRef.current = setTimeout(() => {
      closeGraceTimerRef.current = null;
      setIsPopoverClosing(true);
      exitAnimationTimerRef.current = setTimeout(() => {
        setHoveredCourse(null);
        setAnchorRect(null);
        setIsPopoverClosing(false);
        exitAnimationTimerRef.current = null;
      }, POPOVER_EXIT_ANIMATION_MS);
    }, HOVER_CLOSE_GRACE_MS);
  }, [clearCloseTimer]);

  const handleCardMouseEnter = useCallback(
    (course, cardElement) => {
      clearCloseTimer();
      setHoveredCourse(course);
      setAnchorRect(cardElement.getBoundingClientRect());
    },
    [clearCloseTimer]
  );

  const updateScrollButtons = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isAtStart = scrollLeft === 0;
    const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1;

    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);
  }, []);

  const handleCourseGridScroll = useCallback(() => {
    updateScrollButtons();
    closePopover();
  }, [closePopover, updateScrollButtons]);

  const scroll = useCallback(
    (direction) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const scrollDistance = container.clientWidth;
      container.scrollBy({
        left: direction === 'right' ? scrollDistance : -scrollDistance,
        behavior: 'smooth',
      });
      setTimeout(updateScrollButtons, 500); // 滾動完成後檢查狀態
    },
    [updateScrollButtons]
  );

  useEffect(() => {
    const shuffleArray = (array) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    const fetchCourses = async () => {
      try {
        const response = await CourseService.getAllCourses();
        const shuffledCourses = shuffleArray(response.data);
        setCourses(shuffledCourses);
        setTimeout(updateScrollButtons, 0);
      } catch (error) {
        console.error('獲取課程資料失敗:', error);
        setError('獲取課程資料失敗');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [updateScrollButtons]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    container.addEventListener('scroll', handleCourseGridScroll);
    return () => {
      container.removeEventListener('scroll', handleCourseGridScroll);
    };
  }, [handleCourseGridScroll]);

  useEffect(() => {
    if (!isPopoverOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closePopover();
    };

    window.addEventListener('scroll', closePopover, { passive: true });
    window.addEventListener('resize', closePopover);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', closePopover);
      window.removeEventListener('resize', closePopover);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closePopover, isPopoverOpen]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  // 添加觸摸滑動支持
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX,
      isDragging = false;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const currentX = e.touches[0].clientX;
      const diff = startX - currentX;
      if (Math.abs(diff) > 5) {
        container.scrollLeft += diff;
        startX = currentX;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  if (isLoading) return <CourseSkeleton />;
  if (error)
    return (
      <div>
        錯誤: {error}
        <CourseSkeleton />
      </div>
    );
  if (courses.length === 0) return <div>目前沒有可用的課程</div>;

  return (
    <div className="course-card-scroller" onWheelCapture={closePopoverImmediately}>
      <ScrollButton
        direction="left"
        onClick={() => scroll('left')}
        isVisible={showLeftArrow}
      />
      <div ref={containerRef} className="course-card-grid">
        {courses.map((course, index) => (
          <CourseCard
            key={course._id}
            ref={(el) => (cardsRef.current[index] = el)}
            course={course}
            showAlert={showAlert}
            currentUser={currentUser}
            onCardMouseEnter={handleCardMouseEnter}
            onCardMouseLeave={scheduleClosePopover}
          />
        ))}
      </div>
      <ScrollButton
        direction="right"
        onClick={() => scroll('right')}
        isVisible={showRightArrow}
      />
      <CourseHoverPopover
        course={hoveredCourse}
        anchorRect={anchorRect}
        showAlert={showAlert}
        currentUser={currentUser}
        isClosing={isPopoverClosing}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClosePopover}
        onWheel={closePopoverImmediately}
      />
    </div>
  );
};

export default CourseCardScroller;
