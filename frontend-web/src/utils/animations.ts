import { Variants } from 'framer-motion';

/**
 * Shared animation variants for consistent animations across the app
 */

// Fade in from bottom animation
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

// Fade in animation
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4 }
    }
};

// Scale on hover animation
export const scaleHover: Variants = {
    initial: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
};

// Container with stagger children
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

// Stagger children item
export const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

// Slide in from left
export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

// Slide in from right
export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

// Page transition
export const pageTransition: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.3 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

// Card hover effect
export const cardHover = {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.2 }
};

// Button hover
export const buttonHover = {
    scale: 1.05,
    transition: { duration: 0.2 }
};

// Viewport settings for animations
export const viewportOnce = {
    once: true,
    margin: '-50px'
};

// Limited stagger for large lists (max 10 items animated)
export const getLimitedStagger = (index: number, maxStagger = 10): number => {
    return index < maxStagger ? index * 0.05 : 0;
};
