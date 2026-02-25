/* eslint-disable @typescript-eslint/no-var-requires */
/* Auto-mock for framer-motion — used by Jest in all test files automatically */
const ReactMock = require('react');

const forwardMotion = (tag: string) =>
    ReactMock.forwardRef((props: any, ref: any) => {
        // Strip framer-motion-specific props before passing to DOM
        const {
            initial, animate, exit, transition, variants,
            whileHover, whileTap, whileFocus, whileDrag, whileInView,
            layout, layoutId, onAnimationStart, onAnimationComplete,
            drag, dragConstraints, dragElastic, dragMomentum,
            ...domProps
        } = props;
        return ReactMock.createElement(tag, { ref, ...domProps });
    });

module.exports = {
    __esModule: true,
    motion: {
        div: forwardMotion('div'),
        button: forwardMotion('button'),
        p: forwardMotion('p'),
        span: forwardMotion('span'),
        a: forwardMotion('a'),
        ul: forwardMotion('ul'),
        li: forwardMotion('li'),
        img: forwardMotion('img'),
        h1: forwardMotion('h1'),
        h2: forwardMotion('h2'),
        h3: forwardMotion('h3'),
        nav: forwardMotion('nav'),
        section: forwardMotion('section'),
        form: forwardMotion('form'),
        input: forwardMotion('input'),
        label: forwardMotion('label'),
        header: forwardMotion('header'),
        footer: forwardMotion('footer'),
        main: forwardMotion('main'),
    },
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({
        start: jest.fn(),
        stop: jest.fn(),
        set: jest.fn(),
    }),
    useMotionValue: (initial: any) => ({
        get: () => initial,
        set: jest.fn(),
        onChange: jest.fn(),
    }),
    useTransform: () => ({
        get: () => 0,
        set: jest.fn(),
    }),
};
