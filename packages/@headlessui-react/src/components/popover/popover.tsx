import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,

  // Types
  Dispatch,
  ElementType,
  Ref,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useRef,
  useState,
  ContextType,
} from 'react'

import { Props } from '../../types'
import { match } from '../../utils/match'
import { forwardRefWithAs, render, Features, PropsForFeatures } from '../../utils/render'
import { useSyncRefs } from '../../hooks/use-sync-refs'
import { useId } from '../../hooks/use-id'
import { Keys } from '../keyboard'
import { isDisabledReactIssue7711 } from '../../utils/bugs'

enum PopoverStates {
  Open,
  Closed,
}

interface StateDefinition {
  popoverState: PopoverStates

  linkedPanel: boolean

  buttonId: string
  panelId: string
}

enum ActionTypes {
  TogglePopover,
  ClosePopover,

  SetButtonId,
  SetPanelId,

  LinkPanel,
  UnlinkPanel,
}

type Actions =
  | { type: ActionTypes.TogglePopover }
  | { type: ActionTypes.ClosePopover }
  | { type: ActionTypes.SetButtonId; buttonId: string }
  | { type: ActionTypes.SetPanelId; panelId: string }
  | { type: ActionTypes.LinkPanel }
  | { type: ActionTypes.UnlinkPanel }

let reducers: {
  [P in ActionTypes]: (
    state: StateDefinition,
    action: Extract<Actions, { type: P }>
  ) => StateDefinition
} = {
  [ActionTypes.TogglePopover]: state => ({
    ...state,
    popoverState: match(state.popoverState, {
      [PopoverStates.Open]: PopoverStates.Closed,
      [PopoverStates.Closed]: PopoverStates.Open,
    }),
  }),
  [ActionTypes.ClosePopover](state) {
    if (state.popoverState === PopoverStates.Closed) return state
    return { ...state, popoverState: PopoverStates.Closed }
  },
  [ActionTypes.LinkPanel](state) {
    if (state.linkedPanel === true) return state
    return { ...state, linkedPanel: true }
  },
  [ActionTypes.UnlinkPanel](state) {
    if (state.linkedPanel === false) return state
    return { ...state, linkedPanel: false }
  },
  [ActionTypes.SetButtonId](state, action) {
    if (state.buttonId === action.buttonId) return state
    return { ...state, buttonId: action.buttonId }
  },
  [ActionTypes.SetPanelId](state, action) {
    if (state.panelId === action.panelId) return state
    return { ...state, panelId: action.panelId }
  },
}

let PopoverContext = createContext<[StateDefinition, Dispatch<Actions>] | null>(null)
PopoverContext.displayName = 'PopoverContext'

function usePopoverContext(component: string) {
  let context = useContext(PopoverContext)
  if (context === null) {
    let err = new Error(`<${component} /> is missing a parent <${Popover.name} /> component.`)
    if (Error.captureStackTrace) Error.captureStackTrace(err, usePopoverContext)
    throw err
  }
  return context
}

let PopoverGroupContext = createContext<{
  registerPopoverMenu(registerbag: PopoverRegisterBag): void
  unregisterPopoverMenu(registerbag: PopoverRegisterBag): void
  isFocusWithinPopoverGroup(): boolean
  closeOthers(buttonId: string): void
} | null>(null)
PopoverGroupContext.displayName = 'PopoverGroupContext'

function usePopoverGroupContext() {
  return useContext(PopoverGroupContext)
}

interface PopoverRegisterBag {
  buttonId: string
  panelId: string
  close(): void
}
function stateReducer(state: StateDefinition, action: Actions) {
  return match(action.type, reducers, state, action)
}

// ---

let DEFAULT_FLYOUT_TAG = 'div' as const
interface PopoverRenderPropArg {
  open: boolean
}

export function Popover<TTag extends ElementType = typeof DEFAULT_FLYOUT_TAG>(
  props: Props<TTag, { open: boolean }>
) {
  let buttonId = `headlessui-popover-button-${useId()}`
  let panelId = `headlessui-popover-panel-${useId()}`

  let reducerBag = useReducer(stateReducer, {
    popoverState: PopoverStates.Closed,
    linkedPanel: false,
    buttonId,
    panelId,
  } as StateDefinition)
  let [{ popoverState }, dispatch] = reducerBag

  useEffect(() => dispatch({ type: ActionTypes.SetButtonId, buttonId }), [buttonId, dispatch])
  useEffect(() => dispatch({ type: ActionTypes.SetPanelId, panelId }), [panelId, dispatch])

  let registerBag = useMemo(
    () => ({ buttonId, panelId, close: () => dispatch({ type: ActionTypes.ClosePopover }) }),
    [buttonId, panelId, dispatch]
  )

  let groupContext = usePopoverGroupContext()
  let registerPopoverMenu = groupContext?.registerPopoverMenu
  let isFocusWithinPopoverGroup =
    groupContext?.isFocusWithinPopoverGroup ??
    function isFocusWithinPopover() {
      return (
        document.getElementById(buttonId)?.contains(document.activeElement) ||
        document.getElementById(panelId)?.contains(document.activeElement)
      )
    }

  useEffect(() => registerPopoverMenu?.(registerBag), [registerPopoverMenu, registerBag])

  useEffect(() => {
    if (popoverState !== PopoverStates.Open) return

    function handler() {
      if (isFocusWithinPopoverGroup?.()) return
      dispatch({ type: ActionTypes.ClosePopover })
    }

    window.addEventListener('focus', handler, true)
    return () => window.removeEventListener('focus', handler, true)
  }, [popoverState, isFocusWithinPopoverGroup, groupContext, buttonId, panelId, dispatch])

  let propsBag = useMemo<PopoverRenderPropArg>(
    () => ({ open: popoverState === PopoverStates.Open }),
    [popoverState]
  )

  return (
    <PopoverContext.Provider value={reducerBag}>
      {render(props, propsBag, DEFAULT_FLYOUT_TAG)}
    </PopoverContext.Provider>
  )
}

// ---

let DEFAULT_BUTTON_TAG = 'button' as const
interface ButtonRenderPropArg {
  open: boolean
}
type ButtonPropsWeControl =
  | 'id'
  | 'type'
  | 'aria-expanded'
  | 'aria-controls'
  | 'onKeyDown'
  | 'onClick'

let Button = forwardRefWithAs(function Button<TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(
  props: Props<TTag, ButtonRenderPropArg, ButtonPropsWeControl>,
  ref: Ref<HTMLButtonElement>
) {
  let [state, dispatch] = usePopoverContext([Popover.name, Button.name].join('.'))
  let internalButtonRef = useRef<HTMLButtonElement | null>(null)
  let buttonRef = useSyncRefs(internalButtonRef, ref)

  let groupContext = usePopoverGroupContext()
  let closeOthers = groupContext?.closeOthers

  let handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case Keys.Space:
        case Keys.Enter:
          event.preventDefault()
          if (state.popoverState === PopoverStates.Closed) closeOthers?.(state.buttonId)
          dispatch({ type: ActionTypes.TogglePopover })
          break

        case Keys.Escape:
          if (state.popoverState !== PopoverStates.Open) return closeOthers?.(state.buttonId)
          if (!internalButtonRef.current) return
          if (!internalButtonRef.current.contains(document.activeElement)) return
          event.preventDefault()
          dispatch({ type: ActionTypes.ClosePopover })
          break
      }
    },
    [dispatch, state, internalButtonRef, closeOthers]
  )

  let handleClick = useCallback(
    (event: ReactMouseEvent) => {
      if (isDisabledReactIssue7711(event.currentTarget)) return
      if (props.disabled) return
      if (state.popoverState === PopoverStates.Closed) closeOthers?.(state.buttonId)
      dispatch({ type: ActionTypes.TogglePopover })
    },
    [dispatch, state.popoverState, state.buttonId, props.disabled, closeOthers]
  )

  let propsBag = useMemo<ButtonRenderPropArg>(
    () => ({ open: state.popoverState === PopoverStates.Open }),
    [state]
  )

  let passthroughProps = props
  let propsWeControl = {
    ref: buttonRef,
    id: state.buttonId,
    type: 'button',
    'aria-expanded': state.popoverState === PopoverStates.Open ? true : undefined,
    'aria-controls': state.linkedPanel ? state.panelId : undefined,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
  }

  return render({ ...passthroughProps, ...propsWeControl }, propsBag, DEFAULT_BUTTON_TAG)
})

// ---

let DEFAULT_PANEL_TAG = 'div' as const
interface PanelRenderPropArg {
  open: boolean
}
type PanelPropsWeControl = 'id' | 'onKeyDown'

let PanelRenderFeatures = Features.RenderStrategy | Features.Static

let Panel = forwardRefWithAs(function Panel<TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(
  props: Props<TTag, PanelRenderPropArg, PanelPropsWeControl> &
    PropsForFeatures<typeof PanelRenderFeatures>,
  ref: Ref<HTMLDivElement>
) {
  let [state, dispatch] = usePopoverContext([Popover.name, Panel.name].join('.'))
  let internalPanelRef = useRef<HTMLDivElement | null>(null)
  let panelRef = useSyncRefs(internalPanelRef, ref, () => {
    if (state.linkedPanel) return
    dispatch({ type: ActionTypes.LinkPanel })
  })

  let handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case Keys.Escape:
          if (state.popoverState !== PopoverStates.Open) return
          if (!internalPanelRef.current) return
          if (!internalPanelRef.current.contains(document.activeElement)) return
          event.preventDefault()
          dispatch({ type: ActionTypes.ClosePopover })
          document.getElementById(state.buttonId)?.focus({ preventScroll: true })
          break
      }
    },
    [state, internalPanelRef, dispatch]
  )

  // Unlink on "unmount" myself
  useEffect(() => () => dispatch({ type: ActionTypes.UnlinkPanel }), [dispatch])

  // Unlink on "unmount" children
  useEffect(() => {
    if (state.popoverState === PopoverStates.Closed && (props.unmount ?? true)) {
      dispatch({ type: ActionTypes.UnlinkPanel })
    }
  }, [state.popoverState, props.unmount, dispatch])

  let propsBag = useMemo<PanelRenderPropArg>(
    () => ({ open: state.popoverState === PopoverStates.Open }),
    [state]
  )
  let propsWeControl = {
    ref: panelRef,
    id: state.panelId,
    onKeyDown: handleKeyDown,
  }
  let passthroughProps = props

  return render(
    { ...passthroughProps, ...propsWeControl },
    propsBag,
    DEFAULT_PANEL_TAG,
    PanelRenderFeatures,
    state.popoverState === PopoverStates.Open
  )
})

// ---

let DEFAULT_GROUP_TAG = 'div' as const
interface GroupRenderPropArg {}
type GroupPropsWeControl = 'id'

function Group<TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(
  props: Props<TTag, GroupRenderPropArg, GroupPropsWeControl>
) {
  let propsBag = useMemo<GroupRenderPropArg>(() => ({}), [])
  let propsWeControl = {}
  let passthroughProps = props

  let [popoverMenus, setPopoverMenus] = useState<PopoverRegisterBag[]>([])

  let unregisterPopoverMenu = useCallback(
    (registerbag: PopoverRegisterBag) => {
      setPopoverMenus(existing => {
        let idx = existing.indexOf(registerbag)
        if (idx !== -1) {
          let clone = existing.slice()
          clone.splice(idx, 1)
          return clone
        }
        return existing
      })
    },
    [setPopoverMenus]
  )

  let registerPopoverMenu = useCallback(
    (registerbag: PopoverRegisterBag) => {
      setPopoverMenus(existing => [...existing, registerbag])
      return () => unregisterPopoverMenu(registerbag)
    },
    [setPopoverMenus, unregisterPopoverMenu]
  )

  let isFocusWithinPopoverGroup = useCallback(() => {
    let element = document.activeElement as HTMLElement
    return popoverMenus.some(bag => {
      return (
        document.getElementById(bag.buttonId)?.contains(element) ||
        document.getElementById(bag.panelId)?.contains(element)
      )
    })
  }, [popoverMenus])

  let closeOthers = useCallback(
    (buttonId: string) => {
      for (let popoverMenu of popoverMenus) {
        if (popoverMenu.buttonId !== buttonId) popoverMenu.close()
      }
    },
    [popoverMenus]
  )

  let contextBag = useMemo<ContextType<typeof PopoverGroupContext>>(
    () => ({
      registerPopoverMenu,
      unregisterPopoverMenu,
      isFocusWithinPopoverGroup,
      closeOthers,
    }),
    [registerPopoverMenu, unregisterPopoverMenu, isFocusWithinPopoverGroup, closeOthers]
  )

  return (
    <PopoverGroupContext.Provider value={contextBag}>
      {render({ ...passthroughProps, ...propsWeControl }, propsBag, DEFAULT_GROUP_TAG)}
    </PopoverGroupContext.Provider>
  )
}

// ---

Popover.Button = Button
Popover.Panel = Panel
Popover.Group = Group
