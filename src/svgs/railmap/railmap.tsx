import * as React from 'react';

import { ParamContext } from '../../context';
import StripMTR from '../strip/strip-mtr';
import StripGZMTR from '../strip/strip-gzmtr';
import Main from './main';
import Defs from './defs';

const RailMap = () => {
    const { param } = React.useContext(ParamContext);
    return (
        <svg
            id="destination"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            style={{
                width: 'var(--rmg-svg-width)',
                height: 'var(--rmg-svg-height)',
                ['--rmg-svg-width' as any]: param.svg_width + 'px',
                ['--rmg-svg-height' as any]: param.svg_height + 'px',
                ['--rmg-theme-colour' as any]: param.theme[2],
            }}
        >
            <React.Suspense fallback="loading">
                <Defs />
            </React.Suspense>

            <rect id="outer" x={0} y={0} />

            {window.urlParams.get('style') === 'mtr' && <StripMTR stripPc={param.strip_pc} />}
            {window.urlParams.get('style') === 'gzmtr' && (
                <StripGZMTR variant={param.info_panel_type} isShowLight={false} isShowPSD={false} />
            )}

            <Main />
        </svg>
    );
};

export default RailMap;
