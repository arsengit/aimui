import './Table.less';

import React, { Fragment, useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { classNames } from '../../../utils';
import UI from '../..';

const margin = 5;
const offset = 30;

function Table(props) {
  let [expanded, setExpanded] = useState({});
  let prevExpanded = useRef(props.expanded);

  useEffect(() => {
    if (props.expanded && props.groups) {
      for (let groupKey in props.expanded) {
        if (props.expanded[groupKey] && prevExpanded.current[groupKey] !== props.expanded[groupKey]) {
          setExpanded(exp => ({
            ...exp,
            [groupKey]: true
          }));
        }
      }
    }
    prevExpanded.current = props.expanded;
  }, [props.expanded]);

  const leftPane = props.columns.some(col => col.stick === 'left') ? props.columns.filter(col => col.stick === 'left') : null;
  const middlePane = props.columns.filter(col => !col.hasOwnProperty('stick'));
  const rightPane = props.columns.some(col => col.stick === 'right') ? props.columns.filter(col => col.stick === 'right') : null;

  function expand(groupKey) {
    if (groupKey === 'expand_all') {
      let groupsForExpansion = {};
      for (let key in props.data) {
        groupsForExpansion[key] = true;
        prevExpanded.current[key] = true;
      }
      setExpanded({
        ...expanded,
        ...groupsForExpansion
      });
    } else if (groupKey === 'collapse_all') {
      for (let key in props.data) {
        prevExpanded.current[key] = false;
      }
      setExpanded({});
    } else {
      prevExpanded.current[groupKey] = !expanded[groupKey];
      setExpanded({
        ...expanded,
        [groupKey]: !expanded[groupKey]
      });
    }
  }

  return (
    <div className='Table__container'>
      <div className={classNames({
        Table: true,
        'Table--grouped': props.groups
      })}>
        {
          leftPane && (
            <div className='Table__pane Table__pane--left'>
              {
                leftPane.map((col, index) => (
                  <Column
                    key={col.key}
                    topHeader={props.topHeader}
                    showTopHeaderContent={props.topHeader && props.columns[index - 1]?.topHeader !== col.topHeader}
                    showTopHeaderBorder={props.topHeader && props.columns[index + 1]?.topHeader !== col.topHeader}
                    col={col}
                    data={props.data}
                    groups={props.groups}
                    expanded={expanded}
                    expand={expand}
                    showGroupConfig={index === 0}
                  />
                ))
              }
            </div>
          )
        }
        <div className='Table__pane Table__pane--middle'>
          {
            middlePane.map((col, index) => (
              <Column
                key={col.key}
                topHeader={props.topHeader}
                showTopHeaderContent={
                  props.topHeader && props.columns[(leftPane ? leftPane.length : 0) + index - 1]?.topHeader !== col.topHeader
                }
                showTopHeaderBorder={
                  props.topHeader && props.columns[(leftPane ? leftPane.length : 0) + index + 1]?.topHeader !== col.topHeader
                }
                col={col}
                data={props.data}
                groups={props.groups}
                expanded={expanded}
                expand={expand}
                showGroupConfig={
                  index === 0 && props.columns.filter(col => col.stick === 'left').length === 0
                }
              />
            ))
          }
        </div>
        {
          rightPane && (
            <div className='Table__pane Table__pane--right'>
              {
                rightPane.map((col, index) => (
                  <Column
                    key={col.key}
                    topHeader={props.topHeader}
                    showTopHeaderContent={
                      props.topHeader && props.columns[(leftPane ? leftPane.length : 0) + middlePane.length + index - 1]?.topHeader !== col.topHeader
                    }
                    showTopHeaderBorder={
                      props.topHeader && props.columns[(leftPane ? leftPane.length : 0) + middlePane.length + index + 1]?.topHeader !== col.topHeader
                    }
                    col={col}
                    data={props.data}
                    groups={props.groups}
                    expanded={expanded}
                    expand={expand}
                    showGroupConfig={
                      index === 0 && rightPane.length === props.columns.length
                    }
                  />
                ))
              }
            </div>
          )
        }
      </div>
    </div>
  );
}

function Column({
  topHeader,
  showTopHeaderContent,
  showTopHeaderBorder,
  col,
  data,
  groups,
  expanded,
  expand,
  showGroupConfig
}) {
  return (
    <div className='Table__column'>
      {
        topHeader && (
          <div
            className='Table__cell Table__cell--header Table__cell--topHeader'
            style={{
              minWidth: col.minWidth,
              borderRight: showTopHeaderBorder ? '' : 'none',
            }}
          >
            {showTopHeaderContent && col.topHeader && (
              <UI.Text>{col.topHeader}</UI.Text>
            )}
          </div>
        )
      }
      <div
        className='Table__cell Table__cell--header'
        style={{
          minWidth: col.minWidth,
        }}
      >
        {col.content}
      </div>
      {
        groups ? Object.keys(data).map(groupKey => (
          <div key={groupKey} className='Table__group'>
            <div
              className={classNames({
                Table__group__config__cell: true,
                expanded: expanded[groupKey]
              })}
            >
              {showGroupConfig && (
                <GroupConfig
                  config={data[groupKey].config}
                  expand={expand}
                  expanded={expanded}
                  groupKeys={Object.keys(data)}
                  groupKey={groupKey}
                />
              )}
            </div>
            <Cell
              col={col}
              item={typeof data[groupKey].data[col.key] === 'object' && data[groupKey].data[col.key].expandable ? {
                ...data[groupKey].data[col.key],
                props: {
                  ...data[groupKey].data[col.key]?.props,
                  onClick: e => expand(groupKey)
                }
              } : data[groupKey].data[col.key]}
              className={classNames({
                Table__group__header__cell: true,
                expanded: expanded[groupKey],
                expandable: typeof data[groupKey].data[col.key] === 'object' && data[groupKey].data[col.key].expandable
              })}
            />
            {
              expanded[groupKey] && data[groupKey].items.map((item, i) => (
                <Cell key={col.key + i} col={col} item={item[col.key]} />
              ))
            }
          </div>
        )) : data.map((item, i) => (
          <Cell key={col.key + i} col={col} item={item[col.key]} />
        ))
      }
    </div>
  );
}

function Cell({ item, className }) {
  return (
    <div
      className={classNames({
        Table__cell: true,
        [`${typeof item === 'object' && item.className}`]: true,
        [className]: !!className,
        clickable: typeof item === 'object' && !!item.props?.onClick,
      })}
      style={{
        cursor: typeof item === 'object' && item.props?.onClick ? 'pointer' : 'inherit',
        ...typeof item === 'object' && item.hasOwnProperty('style') && item.style
      }}
      {...typeof item === 'object' && item.props}
    >
      {typeof item === 'object' && item.hasOwnProperty('content') ? (
        item.content
      ) : item ?? '-'}
    </div>
  );
}

function GroupConfig({ config, expand, expanded, groupKeys, groupKey }) {
  let [opened, setOpened] = useState(false);
  let [position, setPosition] = useState({});

  let containerRectRef = useRef();
  let containerRef = useRef();
  let popupRef = useRef();
  let portalRef = useRef(document.createElement('div'));
  let timerRef = useRef();

  useEffect(() => {
    if (opened && !document.body.contains(portalRef.current)) {
      document.body.append(portalRef.current);
    } else if (!opened && document.body.contains(portalRef.current)) {
      document.body.removeChild(portalRef.current);
    }
    return () => {
      if (document.body.contains(portalRef.current)) {
        document.body.removeChild(portalRef.current);
      }
    };
  }, [opened]);

  useEffect(() => {
    if (opened && popupRef.current) {
      popupRef.current.focus();
      containerRectRef.current = containerRef.current.getBoundingClientRect();
    }
  }, [opened]);

  useEffect(() => {
    if (opened && containerRef.current && popupRef.current) {
      calculatePosition();
      timerRef.current = setInterval(() => {
        if (containerRef.current && popupRef.current) {
          let containerRect = containerRef.current.getBoundingClientRect();
          if (Math.abs(containerRectRef.current.x - containerRect.x) > offset || Math.abs(containerRectRef.current.y - containerRect.y) > offset) {
            setOpened(false);
          } else {
            calculatePosition();
          }
        }
      }, 250);
    }
    return () => {
      clearInterval(timerRef.current);
    };
  }, [opened]);

  function calculatePosition() {
    let positions = {
      top: null,
      left: null
    };
    let containerRect = containerRef.current.getBoundingClientRect();
    let popupRect = popupRef.current.getBoundingClientRect();

    if (!containerRectRef.current) {
      containerRectRef.current = containerRect;
    }

    if ((containerRect.y + containerRect.height + margin + popupRect.height) >= window.innerHeight) {
      positions.top = containerRect.top - popupRect.height - margin;
    } else {
      positions.top = containerRect.bottom + margin;
    }

    if ((containerRect.x - popupRect.width + containerRect.width) <= 10) {
      positions.left = margin;
    } else {
      positions.left = containerRect.x - popupRect.width + containerRect.width;
    }

    setPosition(p => ({
      ...p,
      ...positions
    }));
  }

  return (
    <>
      <UI.Tooltip tooltip={expanded[groupKey] ? 'Collapse group' : 'Expand group'}>
        <div
          className='Table__group__action'
          onClick={evt => expand(groupKey)}
        >
          <UI.Icon
            i={expanded[groupKey] ? 'unfold_less' : 'unfold_more'}
            scale={1}
          />
        </div>
      </UI.Tooltip>
      {config}
      <UI.Tooltip tooltip='More actions'>
        <div
          className='Table__group__action'
          onClick={evt => setOpened(!opened)}
          ref={containerRef}
        >
          <UI.Icon
            i='more_horiz'
            scale={1}
          />
        </div>
      </UI.Tooltip>
      {opened && ReactDOM.createPortal((
        <div
          className='Table__group__action__popup'
          tabIndex={0}
          ref={popupRef}
          style={position}
          onBlur={evt => {
            const currentTarget = evt.currentTarget;
            if (opened) {
              window.setTimeout(() => {
                if (!currentTarget.contains(document.activeElement)) {
                  setOpened(false);
                }
              }, 200);
            }
          }}
        >
          <div className='Table__group__action__popup__body'>
            <div
              className='Table__group__action__popup__item'
              onClick={evt => {
                expand(groupKey);
                setOpened(false);
              }}
            >
              <UI.Text small>
                {expanded[groupKey] ? 'Collapse group' : 'Expand group'}
              </UI.Text>
            </div>
            {(expanded[groupKey] || groupKeys.some(key => !!expanded[key])) && (
              <div
                className='Table__group__action__popup__item'
                onClick={evt => {
                  expand('collapse_all');
                  setOpened(false);
                }}
              >
                <UI.Text small>Collapse all</UI.Text>
              </div>
            )}
            {(!expanded[groupKey] || groupKeys.some(key => !expanded[key])) && (
              <div
                className='Table__group__action__popup__item'
                onClick={evt => {
                  expand('expand_all');
                  setOpened(false);
                }}
              >
                <UI.Text small>Expand all</UI.Text>
              </div>
            )}
          </div>
        </div>
      ), portalRef.current)}
    </>
  );
}

export default Table;