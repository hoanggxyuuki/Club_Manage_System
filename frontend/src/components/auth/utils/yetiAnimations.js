/**
 * Yeti Animation Utility Functions
 * This file provides animation functions for the Yeti login component
 */

/**
 * Configures the initial state of the arms
 * @param {Object} armL - Left arm SVG element
 * @param {Object} armR - Right arm SVG element
 * @param {Object} TweenMax - GSAP TweenMax instance
 */
export const setupArms = (armL, armR, TweenMax) => {
    TweenMax.set(armL, {x: -93, y: 220, rotation: 105, transformOrigin: "top left"});
    TweenMax.set(armR, {x: -93, y: 220, rotation: -105, transformOrigin: "top right"});
};

/**
 * Animation for covering eyes with arms
 * @param {Object} armL - Left arm SVG element
 * @param {Object} armR - Right arm SVG element
 * @param {Object} TweenMax - GSAP TweenMax instance
 * @param {Object} Quad - GSAP Quad easing
 */
export const coverEyes = (armL, armR, TweenMax, Quad) => {
    TweenMax.to(armL, 0.45, {x: -93, y: 10, rotation: 0, ease: Quad.easeOut});
    TweenMax.to(armR, 0.45, {x: -93, y: 10, rotation: 0, ease: Quad.easeOut, delay: 0.1});
};

/**
 * Animation for uncovering eyes with arms
 * @param {Object} armL - Left arm SVG element
 * @param {Object} armR - Right arm SVG element
 * @param {Object} TweenMax - GSAP TweenMax instance
 * @param {Object} Quad - GSAP Quad easing
 */
export const uncoverEyes = (armL, armR, TweenMax, Quad) => {
    TweenMax.to(armL, 1.35, {y: 220, ease: Quad.easeOut});
    TweenMax.to(armL, 1.35, {rotation: 105, ease: Quad.easeOut, delay: 0.1});
    TweenMax.to(armR, 1.35, {y: 220, ease: Quad.easeOut});
    TweenMax.to(armR, 1.35, {rotation: -105, ease: Quad.easeOut, delay: 0.1});
};

/**
 * Resets the face to its neutral position
 * @param {Object} elements - Object containing SVG elements
 * @param {Object} TweenMax - GSAP TweenMax instance
 * @param {Object} Expo - GSAP Expo easing
 */
export const resetFace = (elements, TweenMax, Expo) => {
    const { eyeL, eyeR, nose, mouth, chin, face, eyebrow, outerEarL, outerEarR, earHairL, earHairR, hair } = elements;
    
    TweenMax.to([eyeL, eyeR], 1, {x: 0, y: 0, scaleX: 1, scaleY: 1, ease: Expo.easeOut});
    TweenMax.to(nose, 1, {x: 0, y: 0, scaleX: 1, scaleY: 1, ease: Expo.easeOut});
    TweenMax.to(mouth, 1, {x: 0, y: 0, rotation: 0, ease: Expo.easeOut});
    TweenMax.to(chin, 1, {x: 0, y: 0, scaleY: 1, ease: Expo.easeOut});
    TweenMax.to([face, eyebrow], 1, {x: 0, y: 0, skewX: 0, ease: Expo.easeOut});
    TweenMax.to([outerEarL, outerEarR, earHairL, earHairR, hair], 1, {
        x: 0, 
        y: 0, 
        scaleY: 1, 
        ease: Expo.easeOut
    });
};

/**
 * Handles eye and face movement based on cursor position
 * @param {Object} e - Mouse event
 * @param {Object} svgEl - SVG container element
 * @param {Object} elements - Object containing SVG elements
 * @param {Object} TweenMax - GSAP TweenMax instance
 * @param {Object} Expo - GSAP Expo easing
 */
export const handleMouseMove = (e, svgEl, elements, TweenMax, Expo) => {
    const { eyeL, eyeR, nose } = elements;
    
    const svgRect = svgEl.getBoundingClientRect();
    const svgCenterX = svgRect.left + svgRect.width / 2;
    const svgCenterY = svgRect.top + svgRect.height / 2;
    
    
    const deltaX = (e.clientX - svgCenterX) / 25;
    const deltaY = (e.clientY - svgCenterY) / 25;
    
    
    const eyeMaxHorizD = 5;
    const eyeMaxVertD = 3;
    
    const eyeX = Math.max(-eyeMaxHorizD, Math.min(eyeMaxHorizD, deltaX));
    const eyeY = Math.max(-eyeMaxVertD, Math.min(eyeMaxVertD, deltaY));
    const noseX = eyeX * 0.5;
    const noseY = eyeY * 0.5;
    
    
    TweenMax.to([eyeL, eyeR], 0.5, {x: -eyeX, y: -eyeY, ease: Expo.easeOut});
    TweenMax.to(nose, 0.5, {x: -noseX, y: -noseY, ease: Expo.easeOut});
};
