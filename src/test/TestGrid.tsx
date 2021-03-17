/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import {
    Column, Row, Id, MenuOption, SelectionMode, DropPosition, CellLocation,
    DefaultCellTypes, CellChange, ReactGridProps, TextCell, NumberCell, CellStyle, HeaderCell, ChevronCell
} from './../reactgrid';
import { TestConfig } from './testEnvConfig';
import '../styles.scss';
import { FlagCell, FlagCellTemplate } from './flagCell/FlagCellTemplate';

type TestGridCells = DefaultCellTypes | FlagCell;

type TestGridRow = Row<TestGridCells>;

interface TestGridProps {
    enableSticky?: boolean;
    enableColumnAndRowSelection?: boolean;
    enableFrozenFocus?: boolean;
    firstRowType?: TextCell['type'] | HeaderCell['type']; // 'text' if undefined
    firstColType?: ChevronCell['type'] | HeaderCell['type']; // 'chevron' if undefined
    cellType?: TextCell['type'] | HeaderCell['type']; // 'text' if undefined
    config: TestConfig;
    component: React.ComponentClass<ReactGridProps>;
}

const emailValidator: TextCell['validator'] = (email) => {
    const email_regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email_regex.test(email.replace(/\s+/g, ''));
}

const myNumberFormat = new Intl.NumberFormat('pl', { style: 'currency', minimumFractionDigits: 2, maximumFractionDigits: 2, currency: 'PLN' });
const myDateFormat = new Intl.DateTimeFormat('pl', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
const myTimeFormat = new Intl.DateTimeFormat('pl', { hour: '2-digit', minute: '2-digit' });

const style: CellStyle = {
    border: {
        left: { color: 'red', style: 'dashed', width: '2px' },
        top: { color: 'red', style: 'dashed', width: '2px' },
        right: { color: 'red', style: 'dashed', width: '2px' },
        bottom: { color: 'red', style: 'dashed', width: '2px' }
    }
};

export const TestGrid: React.FC<TestGridProps> = (props) => {
    const {
        config, component, enableSticky, enableColumnAndRowSelection, enableFrozenFocus,
        firstRowType = 'text',
        firstColType = 'chevron',
        cellType = 'text',
    } = props;

    const [render, setRender] = React.useState(true);
    const [columns, setColumns] = React.useState(() => new Array(config.columns).fill({ columnId: 0, resizable: true, reorderable: true, width: -1 })
        .map<Column>((_, ci) => ({ columnId: `col-${ci}`, resizable: true, reorderable: true, width: config.cellWidth })));

    const [rows, setRows] = React.useState(() => new Array(config.rows).fill(0).map<TestGridRow>((_, ri) => ({
        rowId: `row-${ri}`,
        reorderable: true,
        height: config.cellHeight,
        cells: columns.map<TestGridCells>((_, ci) => {
            if (ri === 0) return { type: firstRowType, text: `${ri} - ${ci}` }
            if (ri === 2 && ci === 8) return { type: 'text', text: `non-editable`, nonEditable: true, validator: (text: string): boolean => true }
            if (ri === 3 && ci === 8) return { type: 'text', text: '', placeholder: 'placeholder', validator: (text: string): boolean => true }
            const spannedCells = config.spannedCells?.filter(sC => sC.idx === ci && sC.idy === ri)[0];
            const headerCells = config.headerCells?.filter(sC => sC.idx === ci && sC.idy === ri)[0];
            if (spannedCells || headerCells) {
                return { type: cellType, text: `${ri} - ${ci}`, colspan: spannedCells ? spannedCells.colspan : 0, rowspan: spannedCells ? spannedCells.rowspan : 0 }
            }
            const now = new Date();
            switch (ci) {
                case 0:
                    return firstColType === 'chevron'
                        ? { type: 'chevron', groupId: !(ri % 3) ? 'A' : undefined, text: `${ri} - ${ci}`, parentId: ri, isExpanded: ri % 4 ? true : undefined, hasChildren: true }
                        : { type: 'header', groupId: !(ri % 3) ? 'A' : undefined, text: `${ri} - ${ci}` }
                case 1:
                    return { type: 'text', groupId: !(ri % 3) ? 'B' : undefined, text: `${ri} - ${ci}`, style }
                case 2:
                    return { type: 'email', text: `${ri}.${ci}@bing.pl`, validator: emailValidator }
                case 3:
                    return { type: 'number', format: myNumberFormat, value: parseFloat(`${ri}.${ci}`), nanToZero: false, hideZero: true }
                case 4:
                    return { type: 'date', format: myDateFormat, date: new Date(now.setHours((ri * 24), 0, 0, 0)) }
                case 5:
                    return { type: 'time', format: myTimeFormat, time: new Date(now.setHours(now.getHours() + ri)) }
                case 6:
                    return { type: 'checkbox', checked: false, checkedText: 'Checked', uncheckedText: 'Unchecked' }
                case 7:
                    return { type: 'flag', groupId: Math.random() < .66 ? Math.random() < .5 ? 'A' : 'B' : undefined, text: 'bra' }
                case 8:
                    return {
                        type: 'dropdown', values: [
                            { value: 'react', label: 'React' },
                            { value: 'vue', label: 'Vue' },
                            { value: 'angular', label: 'Angular' }
                        ], currentValue: 'react', isDisabled: false
                    }
                case -1: // just for interface testing purposes
                    return { type: 'header', text: ``, rowspan: 3, colspan: 2 }
                default:
                    return { type: 'text', text: `${ri} - ${ci}`, validator: (text: string): boolean => true }
            }
        })
    })));

    const handleColumnResize = (columnId: Id, width: number, selectedColIds: Id[]) => {
        setColumns((prevColumns) => {
            const setColumnWidth = (columnIndex: number) => {
                const resizedColumn = prevColumns[columnIndex];
                prevColumns[columnIndex] = { ...resizedColumn, width };
            }

            if (selectedColIds.includes(columnId)) {
                const stateColumnIndexes = prevColumns
                    .filter(col => selectedColIds.includes(col.columnId))
                    .map(col => prevColumns.findIndex(el => el.columnId === col.columnId));
                stateColumnIndexes.forEach(setColumnWidth);
            } else {
                const columnIndex = prevColumns.findIndex(col => col.columnId === columnId);
                setColumnWidth(columnIndex);
            }
            return [...prevColumns];
        });
    }

    // eslint-disable-next-line
    const handleChangesTest = (changes: CellChange[]) => {
        changes.forEach(change => {
            const ax: TextCell['type'] | NumberCell['type'] = Math.random() > .5 ? 'text' : 'number';
            if (change.newCell.type === ax) {
                console.log(change.newCell.type);
            }
            if (change.type === 'text') {
                console.log(change.newCell.text);
            }
            if (change.type === 'checkbox') {
                console.log(change.previousCell.checked);
            }
        });
    };

    // TODO ReactGrid should be able to handle this function
    // eslint-disable-next-line
    const handleChangesTest2 = (changes: CellChange<TextCell>[]) => { };

    // eslint-disable-next-line
    rows[0].cells.find((cell) => cell.type === "text" && cell.text);

    const handleChanges = (changes: CellChange<TestGridCells>[]) => {
        setRows((prevRows) => {
            changes.forEach((change) => {
                const changeRowIdx = prevRows.findIndex(
                    (el) => el.rowId === change.rowId
                );
                const changeColumnIdx = columns.findIndex(
                    (el) => el.columnId === change.columnId
                );
                if (change.type === 'flag') {
                    // console.log(change.newCell.text);
                }
                if (change.type === 'text') {
                    // console.log(change.newCell.text);
                }
                if (change.type === 'checkbox') {
                    // console.log(change.previousCell.checked);
                }
                prevRows[changeRowIdx].cells[changeColumnIdx] = change.newCell;
            });
            return [...prevRows];
        });
    };

    const reorderArray = <T extends unknown>(arr: T[], idxs: number[], to: number) => {
        const movedElements: T[] = arr.filter((_: T, idx: number) => idxs.includes(idx));
        to = Math.min(...idxs) < to ? to += 1 : to -= idxs.filter(idx => idx < to).length;
        const leftSide: T[] = arr.filter((_: T, idx: number) => idx < to && !idxs.includes(idx));
        const rightSide: T[] = arr.filter((_: T, idx: number) => idx >= to && !idxs.includes(idx));
        return [...leftSide, ...movedElements, ...rightSide];
    }

    const handleCanReorderColumns = (targetColumnId: Id, columnIds: Id[], dropPosition: DropPosition): boolean => {
        return true;
    }

    const handleCanReorderRows = (targetColumnId: Id, rowIds: Id[], dropPosition: DropPosition): boolean => {
        // const rowIndex = state.rows.findIndex((row: Row) => row.rowId === targetColumnId);
        // if (rowIndex === 0) return false;
        return true;
    }

    const handleColumnsReorder = (targetColumnId: Id, columnIds: Id[], dropPosition: DropPosition) => {
        const to = columns.findIndex((column: Column) => column.columnId === targetColumnId);
        const columnIdxs = columnIds.map((id: Id, idx: number) => columns.findIndex((c: Column) => c.columnId === id));
        setRows(rows.map(row => ({ ...row, cells: reorderArray(row.cells, columnIdxs, to) })));
        setColumns(reorderArray(columns, columnIdxs, to));
    }

    const handleRowsReorder = (targetRowId: Id, rowIds: Id[], dropPosition: DropPosition) => {
        setRows((prevRows) => {
            const to = rows.findIndex(row => row.rowId === targetRowId);
            const columnIdxs = rowIds.map(id => rows.findIndex(r => r.rowId === id));
            return reorderArray(prevRows, columnIdxs, to);
        });
    }

    const handleContextMenu = (selectedRowIds: Id[], selectedColIds: Id[], selectionMode: SelectionMode, menuOptions: MenuOption[]): MenuOption[] => {
        if (selectionMode === 'row') {
            menuOptions = [
                ...menuOptions,
                {
                    id: 'rowOption', label: 'Custom menu row option',
                    handler: (selectedRowIds: Id[], selectedColIds: Id[], selectionMode: SelectionMode) => { }
                },
            ]
        }
        if (selectionMode === 'column') {
            menuOptions = [
                ...menuOptions,
                {
                    id: 'columnOption', label: 'Custom menu column option',
                    handler: (selectedRowIds: Id[], selectedColIds: Id[], selectionMode: SelectionMode) => { }
                },
            ]
        }
        return [
            ...menuOptions,
            {
                id: 'all', label: 'Custom menu option',
                handler: (selectedRowIds: Id[], selectedColIds: Id[], selectionMode: SelectionMode) => { }
            },
        ];
    }

    const handleFocusLocationChanged = (location: CellLocation): void => { }

    const handleFocusLocationChanging = (location: CellLocation): boolean => {
        return true;
    }

    const Component = component;
    return (
        <>
            <div className='test-grid-container' data-cy='div-scrollable-element' style={{
                ...(!config.pinToBody && {
                    height: config.fillViewport ? `calc(100vh - 30px)` : config.rgViewportHeight,
                    width: config.fillViewport ? `calc(100vw - 45px)` : config.rgViewportWidth,
                    margin: config.margin,
                    overflow: 'auto',
                }),
                position: 'relative',
                ...(config.flexRow && {
                    display: 'flex',
                    flexDirection: 'row'
                }),
            }}>
                {config.additionalContent &&
                    <div style={{ height: `${config.rgViewportHeight}px`, backgroundColor: '#fafff3' }}>
                        <Logo isPro={config.isPro} width={config.rgViewportWidth} />
                        <Logo isPro={config.isPro} width={config.rgViewportWidth} />
                        <Logo isPro={config.isPro} width={config.rgViewportWidth} />
                    </div>
                }
                {render && <Component
                    rows={rows}
                    columns={columns}
                    initialFocusLocation={config.initialFocusLocation}
                    focusLocation={enableFrozenFocus ? config.focusLocation : undefined}
                    // onCellsChanged={handleChangesTest2} // TODO This handler should be allowed
                    onCellsChanged={handleChanges}
                    onColumnResized={handleColumnResize}
                    customCellTemplates={{ 'flag': new FlagCellTemplate() }}
                    highlights={config.highlights}
                    stickyLeftColumns={enableSticky ? config.stickyLeft : undefined}
                    stickyRightColumns={enableSticky ? config.stickyRight : undefined}
                    stickyTopRows={enableSticky ? config.stickyTop : undefined}
                    stickyBottomRows={enableSticky ? config.stickyBottom : undefined}
                    canReorderColumns={handleCanReorderColumns}
                    canReorderRows={handleCanReorderRows}
                    onColumnsReordered={handleColumnsReorder}
                    onRowsReordered={handleRowsReorder}
                    onContextMenu={handleContextMenu}
                    onFocusLocationChanged={handleFocusLocationChanged}
                    onFocusLocationChanging={handleFocusLocationChanging}
                    enableRowSelection={enableColumnAndRowSelection || false}
                    enableColumnSelection={enableColumnAndRowSelection || false}
                    enableFullWidthHeader={config.enableFullWidthHeader || false}
                    enableRangeSelection={config.enableRangeSelection}
                    enableFillHandle={config.enableFillHandle}
                    enableGroupIdRender={config.enableGroupIdRender}
                    labels={config.labels}
                    horizontalStickyBreakpoint={config.horizontalStickyBreakpoint}
                    verticalStickyBreakpoint={config.verticalStickyBreakpoint}
                />}
                {config.additionalContent &&
                    <div style={{ height: `${config.rgViewportHeight}px`, backgroundColor: '#fafff3' }}>
                        <Logo isPro={config.isPro} width={config.rgViewportWidth} />
                        <Logo isPro={config.isPro} width={config.rgViewportWidth} />
                        <Logo isPro={config.isPro} width={config.rgViewportWidth} />
                    </div>
                }
            </div>
            {!config.fillViewport &&
                <>
                    <input type='text' data-cy='outer-input' />
                    <Logo isPro={config.isPro} />
                </>
            }
            <TestGridOptionsSelect isPro={config.isPro}></TestGridOptionsSelect>
            <button onClick={()=> {
                setRender((render) => !render);
            }}>Mount / Unmount</button>
            {config.additionalContent &&
                <>
                    <h1 style={{ width: 3000 }}>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                    <h1>TEXT</h1> Test WITH IT
                </>
            }
        </>
    )

}

const Logo: React.FC<{ isPro?: boolean; width?: number }> = ({ isPro, width }) => {
    return <div style={{ display: 'flex', width: `${width}px` }}>
        <h1 style={{ position: 'relative' }}>
            ReactGrid
            {isPro && <div
                style={{
                    position: 'absolute',
                    top: '-0.5em',
                    right: 0,
                    height: '2.5em',
                    width: '2.5em',
                    transform: 'translateX(100%) rotate(90deg)',
                    background: 'gold',
                    fontSize: '0.3em',
                    color: 'black'
                }}>
                PRO</div>}
        </h1>
    </div >
}

export const TestGridOptionsSelect: React.FC<{ isPro?: boolean }> = ({ isPro }) => {
    const navigate = (eventValue: string) => {
        window.location.pathname = eventValue;
    }
    return (
        <form>
            <select defaultValue={window.location.pathname}
                onChange={(event) => navigate(event.target.value)}
            >
                <option value='/'>/</option>
                <option value='/enableHeaders'>Enable headers</option>
                <option value='/enableSticky'>Enable sticky</option>
                <option value='/enableFrozenFocus'>Enable frozen focus</option>
                <option value='/enablePinnedToBody'>Enable pinned to body</option>
                <option value='/enableStickyPinnedToBody'>Enable sticky pinned to body</option>
                <option value='/enableAdditionalContent'>Enable additional content</option>
                <option value='/enableSymetric'>Enable symetric</option>
                <option value='/enableFrozenFocus'>Enable frozen focus</option>
                <option value='/enableResponsiveSticky'>Enable responsive sticky</option>
                <option value='/enableResponsiveStickyPinnedToBody'>Enable responsive sticky pinned to body</option>
                <option value='/enableSpannedCells'>Enable spanned cells</option>
                {isPro && <>
                    <option value='/enableColumnAndRowSelection'>Enable column and row selection</option>
                    <option value='/enableColumnAndRowSelectionWithSticky'>Enable column and row selection with sticky</option>
                    <option value='/enableResponsiveStickyPro'>Enable responsive sticky PRO</option>
                    <option value='/enableResponsiveStickyPinnedToBodyPro'>Enable responsive sticky pinned to body PRO</option>
                </>}
            </select>
        </form>
    )
}

export const withDiv = <T extends Record<string, unknown> & TestGridProps>(Component: React.ComponentType<T>): React.FC<T> => {
    Component.displayName = 'WithDivWrapperTestGrid';
    const wrappedComponent = ({ ...props }: TestGridProps) => {
        return (
            <div style={{ ...props.config.withDivComponentStyles }}>
                <Component {...props as T} />
            </div>
        )
    }
    return wrappedComponent;
}

export const ExtTestGrid = withDiv(TestGrid);
