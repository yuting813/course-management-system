import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import CourseDetails from './CourseDetails';

const POPOVER_WIDTH = 320;
const POPOVER_MAX_HEIGHT = 544;
const GAP = 16;
const EDGE_PADDING = 16;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const CourseHoverPopover = ({
  course,
  anchorRect,
  showAlert,
  currentUser,
  isClosing,
  onMouseEnter,
  onMouseLeave,
  onWheel,
}) => {
  const position = useMemo(() => {
    if (!anchorRect) return null;

    const rightSpace = window.innerWidth - anchorRect.right;
    const alignRight = rightSpace >= POPOVER_WIDTH + GAP + EDGE_PADDING;
    const left = alignRight
      ? anchorRect.right + GAP
      : anchorRect.left - POPOVER_WIDTH - GAP;

    const visibleHeight = Math.min(
      POPOVER_MAX_HEIGHT,
      window.innerHeight - EDGE_PADDING * 2
    );
    const top = clamp(
      anchorRect.top,
      EDGE_PADDING,
      window.innerHeight - visibleHeight - EDGE_PADDING
    );

    return {
      alignRight,
      style: {
        left: `${clamp(
          left,
          EDGE_PADDING,
          window.innerWidth - POPOVER_WIDTH - EDGE_PADDING
        )}px`,
        top: `${top}px`,
        width: `${POPOVER_WIDTH}px`,
      },
    };
  }, [anchorRect]);

  if (!course || !position) return null;

  return createPortal(
    <div
      className={`course-hover-popover ${
        position.alignRight ? 'align-right' : 'align-left'
      } ${isClosing ? 'is-closing' : ''}`}
      style={position.style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onWheelCapture={onWheel}
    >
      <CourseDetails
        course={course}
        showAlert={showAlert}
        currentUser={currentUser}
      />
    </div>,
    document.body
  );
};

export default CourseHoverPopover;
