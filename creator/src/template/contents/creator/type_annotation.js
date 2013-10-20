/**
 * @typedef {{
 *   setViewsFromJS: function,
 *   setSelectedViewsFromJS: function,
 *   setCurrentViewPosFromJS: function,
 *   setCurrentViewSizeFromJS: function,
 *   changedViewsOrderToJS: {connect: function},
 *   changedSelectedViewToJS: {connect: function},
 *   changedViewPropertyToJS: {connect: function},
 *   addViewToJS: {connect: function},
 *   deleteSelectedViewsToJS: {connect: function},
 *   setScreenToJS: {connect: function},
 *   setScreenEnableToJS: {connect: function},
 *   changedLayoutContentFromJS: function,
 *   unselectAllViewsToJS: {connect: function},
 *   alignSelectedViewsToJS: {connect: function},
 *   arrangeSelectedViewsToJS: {connect: function},
 * }}
 */
Native;

/**
 * @typedef function
 */
Navy.Page;

/**
 * @typedef Object
 */
Navy.Resource;

/**
 * @typedef Object
 */
Navy.Config;

/**
 * @typedef function
 */
document.implementation.createHTMLDocument;
