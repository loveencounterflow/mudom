
'use strict';

// ;(function() {
//----------------------------------------------------------------------------------------------------------
µ.DOM.ready( () => {

//----------------------------------------------------------------------------------------------------------
// const log = console.log;

//----------------------------------------------------------------------------------------------------------
const kblike_eventnames = [
  // ### TAINT not all of these events are needed
  'click',
  // 'dblclick', // implied / preceded by `click` event
  // 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart',
  // 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
  // 'pointercancel',
  'wheel',
  'pointermove',
  'pointerout',
  'pointerover',
  // 'pointerdown',
  // 'pointerenter',
  // 'pointerleave',
  // 'pointerup',
  ]

//----------------------------------------------------------------------------------------------------------
const modifier_names = [
  // ------------- Tier A: ubiquitous, unequivocal
  'Alt',
  'AltGraph',
  'Control',
  'Meta',
  'Shift',
  // ------------- Tier B: status doubtful
  // 'Hyper',
  // 'OS',
  // 'Super',
  // 'Symbol',
  // ------------- Tier C: rare, not needed, or not sensed by JS
  // 'Fn',
  // 'CapsLock',
  // 'FnLock',
  // 'NumLock',
  // 'ScrollLock',
  // 'SymbolLock',
  ]

//----------------------------------------------------------------------------------------------------------
let prv_modifiers = {};
for ( let modifier_name of modifier_names ) {
  prv_modifiers[ modifier_name ] = null; }
Object.freeze( prv_modifiers );

//----------------------------------------------------------------------------------------------------------
let caps_lock_pressed = false;

//----------------------------------------------------------------------------------------------------------
/* Get the last known keyboard modifier state. NOTE may be extended with `event` argument ITF. */
// µ.DOM.get_kb_modifier_state = () => { return { ...prv, }; };

//----------------------------------------------------------------------------------------------------------
µ.DOM.get_changed_kb_modifier_state = () => {
  /* Return keyboard modifier state if it has changed since the last call, or `null` if it hasn't changed. */
  // log( '^33988^', { event, } );
  const crt_modifiers   = { _type: event.type, };
  let has_changed       = false;
  for ( let modifier_name of modifier_names ) {
    const state   = event.getModifierState( modifier_name );
    has_changed   = has_changed || ( prv_modifiers[ modifier_name ] !== state );
    crt_modifiers[ modifier_name ] = state; };
  if ( has_changed ) {
    return prv_modifiers = Object.freeze( crt_modifiers ); };
  return null; };

//----------------------------------------------------------------------------------------------------------
const handle_kblike_event = ( event ) => {
  const modifier_state = µ.DOM.get_changed_kb_modifier_state( event );
  if ( modifier_state != null ) {
    µ.DOM.emit_custom_event( 'mkts_kb_modifier_changed', { detail: modifier_state, } ); };
  set_verdict( event.getModifierState( 'CapsLock' ) );
};

//----------------------------------------------------------------------------------------------------------
for ( let event_name of kblike_eventnames ) {
  µ.DOM.on( document, event_name, handle_kblike_event ); };

//----------------------------------------------------------------------------------------------------------
// const get_kb_modifier_state = ( event, value ) => {
//   let prv_modifiers = {};
//   for ( let modifier_name of modifier_names ) {
//     prv_modifiers[ modifier_name ] = null; }
//   Object.freeze( prv_modifiers );

//----------------------------------------------------------------------------------------------------------
const set_verdict = ( value ) => {
  // console.log('^22928^', µ.DOM.get_kb_modifier_state() );
  if ( value ) {
    µ.DOM.emit_custom_event( 'mkts_capslock_pressed' );
    caps_lock_pressed = true; }
  else {
    µ.DOM.emit_custom_event( 'mkts_capslock_released' );
    caps_lock_pressed = false; }; };

//----------------------------------------------------------------------------------------------------------
µ.DOM.on( document, 'keydown', ( event ) => {
  if ( event.key === 'CapsLock' ) {
    set_verdict( !caps_lock_pressed ); }
  else {
    set_verdict( event.getModifierState( 'CapsLock' ) ); }; } );

//----------------------------------------------------------------------------------------------------------
µ.DOM.on( document, 'keyup', ( event ) => {
  if ( event.key !== 'CapsLock' ) {
    set_verdict( event.getModifierState( 'CapsLock' ) ); }; } );


} );
// })()




