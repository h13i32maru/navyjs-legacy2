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
 *  sizePolicy: "fixed" | "wrapContent",
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
 *    contentLayoutFile: string
 *  }
 * }}
 */
ViewGroupLayout;
