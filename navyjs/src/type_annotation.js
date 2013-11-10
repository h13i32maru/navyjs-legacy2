/**
 * @typedef {HTMLHeadElement}
 */
document.head;

/**
 * @typedef {{
 *  touches: Object[],
 *  changedTouches: Object[]
 * }}
 */
TouchEvent;

/**
 * @typedef {{
 *  id: string,
 *  class: string,
 *  classFile: string,
 *  visible: boolean,
 *  pos: {x: number, y:number, z:number},
 *  sizePolicy: {width: "fixed" | "wrapContent" | "mathParent", height: "fixed" | "wrapContent" | "matchParent"},
 *  size: {width: number, height: number},
 *  backgroundColor: string
 * }}
 */
ViewLayout;

/**
 * @typedef {ViewLayout | {
 *  extra: {
 *    text: string,
 *    fontSize: number
 *  }
 * }}
 */
TextLayout;

/**
 * @typedef {ViewLayout | {
 *  extra: {
 *    src: string
 *  }
 * }}
 */
ImageLayout;

/**
 * @typedef {ViewLayout | {
 *  extra: {
 *    text: string,
 *    fontSize: number,
 *    normal: {
 *      src: string
 *    },
 *    active: {
 *      src: string
 *    },
 *    disabled: {
 *      src: string
 *    }
 *  }
 * }}
 */
ButtonLayout;

/**
 * @typedef {ViewLayout | {
 *  extra: {
 *    contentLayoutFile: string
 *  }
 * }}
 */
ViewGroupLayout;
