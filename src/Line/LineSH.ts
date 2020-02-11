import { RMGLine } from './Line';
import { RMGStationSH, IntStationSH, station_id } from '../Station/StationSH';
import { RMGStation } from '../Station/Station';

import { ID, Name, StationInfo, RMGParam, setParams } from '../utils';

export class RMGLineSH extends RMGLine {
    constructor(param) {
        super(param);
    }

    _initStnInstance(stnId: ID, stnInfo: StationInfo): RMGStation {
        switch (stnInfo.change_type) {
            case 'int2':
            case 'int3_l':
            case 'int3_r':
                return new IntStationSH(stnId, stnInfo);
            case 'osi11_ul':
            case 'osi11_pl':
            case 'osi11_ur':
            case 'osi11_pr':
            case 'osi12_ul':
            case 'osi12_pl':
            case 'osi12_ur':
            case 'osi12_pr':
            case 'osi21_ul':
            case 'osi21_pl':
            case 'osi21_ur':
            case 'osi21_pr':
            case 'osi22_ul':
            case 'osi22_pl':
            case 'osi22_ur':
            case 'osi22_pr':
            default:
                return new RMGStationSH(stnId, stnInfo);
        }
    }

    // draw the destination
    drawDestInfo() {
        $('#station_info_shmetro > #platform > text').text(this._platformNum);

        var bcr = $('#station_info_shmetro > #dest_text')[0].getBoundingClientRect();
        var flagLength = 160 + 150 + bcr.width + 45 + 50;



        // arrow
        var isLeft = (this._direction == 'l') ? 1 : -1;
        var arrowX = (this._svgDestWidth - isLeft * flagLength) / 20;
        arrowX = (this._direction == 'l') ? arrowX : this._svgDestWidth - 20;
        var arrowRotate = 90 * (1 - isLeft);
        $('#station_info_shmetro > #arrow_left_use').attr('transform', `translate(${arrowX},135)rotate(${arrowRotate})`);

        // not in use now
        var platformNumX = arrowX + isLeft * (160 + 50 + 75);
        $('#station_info_shmetro > #platform').attr('transform', `translate(${platformNumX},130)`);

        // list the destination text
        // Todo: fix svg_dest_width*0.8, this has only been tested on 1000 width
        if (this._direction === 'r') {
            var txtAnchor = 'end';
            var destNameX = this._svgDestWidth * 0.8;
        } else {
            var txtAnchor = 'start';
            var destNameX = this._svgDestWidth * 0.2;
        }
        $('#station_info_shmetro > #dest_text').attr({
            transform: `translate(${destNameX},135)`,
            'text-anchor': txtAnchor
        });

        // for each left valid destinations, get the name from id
        var [destinations_zh, destinations_en]: String[][] = [[], []]
        this[`${this._direction}ValidDests`].forEach(stn => {
            destinations_zh.push(this.stations[stn].name[0])
            destinations_en.push(this.stations[stn].name[1])
        });
        $('#station_info_shmetro > #dest_text > text:first-child').text(`往${destinations_zh.join("，")}`)
        $('#station_info_shmetro > #dest_text > text:last-child').text(`To ${destinations_en.join(", ")}`)

        // prepare for the line name
        let lineNameX = this._direction === 'l' ? this._svgDestWidth : 320
        var [lineNameZH, lineNameEN] = this._lineNames;

        // line starts with numbers or letters
        var lineNumber = lineNameZH.match(/(\d*)\w+/)
        if (lineNumber) {
            lineNameX -= 180;
            lineNameZH = "号线"
            $('#station_info_shmetro > #line_number > rect').attr({
                'style': `fill:${this._themeColour}`,
                'transform': `translate(${lineNameX - 120},70)`
            })
            $('#station_info_shmetro > #line_number > text')
                .text(lineNumber[0])
                .attr('transform', `translate(${lineNameX - 100},170)`)
        } else {
            lineNameX -= 280;
            $('#station_info_shmetro > #line_number > rect').attr({
                'style': `fill:${this._themeColour}`,
                'transform': `translate(${lineNameX - 10},60)`,
                'width': 260,
                'height': 150
            })
            $('#station_info_shmetro > #line_number > text').hide()

            // Todo: set the eng in the middle
            $('#station_info_shmetro > #line_name_text > text:last-child').attr('dx', 10)
        }

        // set the line name
        $('#station_info_shmetro > #line_name_text > text:first-child').text(lineNameZH)
        $('#station_info_shmetro > #line_name_text > text:last-child').text(lineNameEN)
        $('#station_info_shmetro > #line_name_text').attr({
            transform: `translate(${lineNameX},135)`,
            'text-anchor': 'start'
        });

        // the last decoration line
        let direction = this._direction == 'l' ? 'left' : 'right'
        $('#line_shmetro_use').attr({
            'xlink:href': `#line_shmetro_${direction}`,
            transform: `translate(0,220)`,
        })
    }

    // rewrite this to append dom and then getBoundingClientRect
    // to get the exact position where int icon can be fit
    drawStns() {
        for (let [stnId, stnInstance] of Object.entries(this.stations)) {
            if (['linestart', 'lineend'].includes(stnId)) { continue; }
            $('#stn_icons').append(stnInstance.html);
        }
        $('#stn_icons').html($('#stn_icons').html()); // Refresh DOM

        for (let [stnId, stnInstance] of Object.entries(this.stations)
            .filter(stn => stn[1] instanceof IntStationSH) as [ID, IntStationSH][]) {
            $(`#rmg-name__shmetro--${stnId}`).parent().append(stnInstance.ungrpIconHTML)
        }
        $('#stn_icons').html($('#stn_icons').html()); // Refresh DOM
    }

    // rewrite this to change the y of branch station
    _stnYShare(stnId): number {
        if (['linestart', 'lineend'].includes(stnId) || this._stnIndegree(stnId) > 1 || this._stnOutdegree(stnId) > 1) {
            return 0;
        }
        var stnPred = this.stations[stnId].parents[0];
        if (stnPred) {
            // parent exist
            if (this._stnOutdegree(stnPred) == 1) {
                // no sibling, then y same as parent
                return this._stnYShare(stnPred);
            } else {
                // sibling exists, then y depends on its idx of being children

                // rewrite this to move the main line on the same height of the rest
                // and branch a bit away from the main line
                return (this.stations[stnPred].children.indexOf(stnId) == 0) ? 3 : 0;
            }
        } else {
            // no parent, must be linestart
            return 0;
        }
    }

    _linePath(stnIds: ID[], type?: 'main' | 'pass'): string {
        var [prevId, prevY, prevX]: [string?, number?, number?] = []
        var path: { [key: string]: number[] } = {}
        const e = 30

        stnIds.forEach(stnId => {
            var [x, y] = ['_stnRealX', '_stnRealY'].map(fun => this[fun](stnId))
            if (!prevY && prevY !== 0) {
                [prevId, prevX, prevY] = [stnId, x, y];
                path['start'] = [x, y];
                return
            }
            if (y === 0) {
                // merge back to main line
                if (y != prevY) {
                    path['bifurcate'] = [prevX, prevY]
                }
            } else {
                // on the branch line
                if (y != prevY) {
                    path['bifurcate'] = [x, y]
                }
            }
            path['end'] = [x, y];
            [prevId, prevX, prevY] = [stnId, x, y];
        });

        // generate path
        if (!path.hasOwnProperty('start')) {
            // no line generated
            // keys in path: none
            return ''
        } else if (!path.hasOwnProperty('end')) {
            // litte line (only beyond terminal station)
            // keys in path: start
            let [x, y] = path['start']
            if (type === 'main') {
                // current at terminal(end) station, draw the litte main line
                if (this._direction === 'l') {
                    return `M ${x},${y - 6} L ${x - e},${y - 6} l -12,12 L ${x},${y + 6} Z`
                } else {
                    return `M ${x},${y - 6} L ${x + e},${y - 6} l 12,12 L ${x},${y + 6} Z`
                }
            } else {
                // type === 'pass'
                // current at terminal(start) station, draw the litte pass line
                if (this._direction === 'l') {
                    return `M ${x},${y - 6} L ${x + e},${y - 6} l 0,12 L ${x - e},${y + 6} Z`
                } else {
                    return `M ${x - e},${y - 6} L ${x},${y - 6} l 0,12 L ${x - e},${y + 6} Z`
                }
            }
        }
        else if (!path.hasOwnProperty('bifurcate')) {
            // general main line
            // keys in path: start, end
            let [x, y] = path['start'], h = path['end'][0]
            if (type === 'main') {
                if (this._direction === 'l') {
                    return `M ${x - e},${y - 6} H ${h} l 0,12 L ${x - 42},${y + 6} Z`
                } else {
                    return `M ${x},${y - 6} H ${h + e} l 12,12 L ${x},${y + 6} Z`
                }
            } else {
                // type === 'pass'
                if (this._direction === 'l') {
                    return `M ${x - e},${y - 6} H ${h + e} l 0,12 L ${x - e},${y + 6} Z`
                } else {
                    return `M ${x - e},${y - 6} H ${h + e} l 0,12 L ${x - e},${y + 6} Z`
                }
            }
        } else {
            // main line bifurcate here to become the branch line
            // and path return here are only branch line
            // keys in path: start, bifurcate, end

            // Todo: disable lower branch
            let [x, y] = path['start'], h = path['end'][0]
            let [xb, yb] = path['bifurcate'], [xm, ym] = path['end']
            if (type === 'main') {
                if (this._direction === 'l') {
                    if (ym > y) {
                        // main line, left direction, center to upper
                        return `M ${x - e},${y - 6} H ${xb + e} L ${xm},${ym - 6} l 0,12 L ${xb + e},${yb + 6} L ${x - e - 12},${y + 6} Z`
                    } else {
                        // main line, left direction, upper to center
                        // this same as the other, but replace x with xm and xm with x
                        return `M ${xm},${ym - 6} H ${xb - e} L ${x},${y - 6} l 0,12 L ${xb - e},${yb + 6} L ${xm},${ym + 6} Z`
                    }
                } else {
                    if (ym > y) {
                        // main line, right direction, upper to center
                        return `M ${x},${y - 6} H ${xb + e} L ${xm},${ym - 6} l 0,12 L ${xb + e},${yb + 6} L ${x},${y + 6} Z`
                    } else {
                        // main line, right direction, center to upper
                        // this same as the other, but replace x with xm and xm with x
                        return `M ${xm + e},${ym - 6} H ${xb - e} L ${x},${y - 6} l 0,12 L ${xb - e},${yb + 6} L ${xm + e + 12},${ym + 6} Z`
                    }
                }
            } else {
                // type === 'pass'
                if (this._direction === 'l') {
                    if (ym > y) {
                        // pass line, left direction, center to upper
                        return `M ${x - e},${y - 6} H ${xb + e} L ${xm},${ym - 6} l 0,12 L ${xb + e},${yb + 6} L ${x - e},${y + 6} Z`
                    } else {
                        // pass line, left direction, upper to center
                        // this same as the other, but replace x with xm and xm with x
                        return `M ${x},${y - 6} L ${xb - e},${yb - 6} H ${xm + e} l 0,12 L ${xb - e},${yb + 6} L ${x},${y + 6} Z`
                    }
                } else {
                    if (ym > y) {
                        // pass line, right direction, upper to center
                        return `M ${x - e},${y - 6} H ${xb + e} L ${xm},${ym - 6} l 0,12 L ${xb + e},${yb + 6} L ${x - e},${y + 6} Z`
                    } else {
                        // pass line, right direction, center to upper
                        // this same as the other, but replace x with xm and xm with x
                        return `M ${x},${y - 6} L ${xb - e},${yb - 6} H ${xm + e} l 0,12 L ${xb - e},${yb + 6} L ${x},${y + 6} Z`
                    }
                }
            }
        }
    }

    // draw the line in railmap
    drawLine() {
        $('.rmg-line').removeClass('rmg-line__mtr').addClass('rmg-line__shmetro');

        this.branches.map(branch => {
            var lineMainStns = branch.filter(stnId => this.stations[stnId].state >= 0);
            var linePassStns = branch.filter(stnId => this.stations[stnId].state <= 0);

            if (lineMainStns.length === 1) {
                linePassStns = branch;
            }

            if (lineMainStns.filter(stnId => linePassStns.indexOf(stnId) !== -1).length == 0 && lineMainStns.length) {
                // if two set disjoint
                if (linePassStns[0] === branch[0]) {
                    // -1 -1 1 1
                    linePassStns.push(lineMainStns[0]);
                } else if (lineMainStns[0] === branch[0] && lineMainStns[lineMainStns.length - 1] === branch[branch.length - 1] && linePassStns.length) {
                    linePassStns = branch;
                    lineMainStns = [];
                } else {
                    // 1 1 -1 -1
                    linePassStns.unshift(lineMainStns[lineMainStns.length - 1]);
                }
            }

            // draw the main line
            let path = this._linePath(lineMainStns, 'main')
            if (path || path != '') {
                $('#line_main').append($('<path>', { id: 'line_main_path', d: path }));
            }

            // draw the pass line
            path = this._linePath(linePassStns, 'pass')
            if (path || path != '') {
                $('#line_pass').append($('<path>', { id: 'line_pass_path', d: path }));
            }
        });

        $('#line_main').html($('#line_main').html());
        $('#line_pass').html($('#line_pass').html());
    }

    fillThemeColour() {
        super.fillThemeColour();

        // this will add the stroke of the station circle
        // however the stroke path is defined in index.html
        // which made changing station style strange
        $('path#' + station_id).attr('stroke', this._themeColour);
        $('path#int2_sh').attr('stroke', this._themeColour);

        // pass stroke should be added somewhere else
        // but I can't figure it out
        $('path#stn_sh_pass').attr('stroke', '#aaa');
        $('path#int2_sh_pass').attr('stroke', '#aaa');

        // the railmap line
        $('path#line_main_path').attr('fill', this._themeColour)
        $('path#line_pass_path').attr('fill', '#aaa')

        // the last decoration line
        let direction = this._direction == 'l' ? 'left' : 'right'
        $(`#line_shmetro_${direction}`).attr('fill', this._themeColour)

        if (this._lineNames[0].match(/(\d*)\w+/)) {
            // the line starts with number
            $('#station_info_shmetro > #line_number > text').attr('fill', '#fff')
        } else {
            // the line starts with letter
            $('#station_info_shmetro > #line_name_text').attr('fill', '#fff')
        }
    }

    updateStnNameBg() {
        $('#current_bg').hide();  // fix the mysterious black rect
    }

    // rewrite this to make sure the line is draw before color
    static initSVG(line) {
        line.drawSVGFrame();
        line.showFrameOuter();
        line.drawStns();

        // change the func call here
        line.drawLine();
        line.fillThemeColour();
        // change the func call here

        line.drawStrip();
        line.drawDestInfo();
        line.loadFonts();
        line.updateStnNameBg();
    }

    // rewrite this to call fillThemeColour when flip direction
    set direction(val) {
        super.direction = val

        this.fillThemeColour()
    }

    // rewrite this to call fillThemeColour when set current station
    set currentStnId(val) {
        super.currentStnId = val

        this.fillThemeColour()
    }

    // rewrite this to get drawStns and recalled
    updateStnTransfer(stnId: ID, type, info = null) {
        super.updateStnTransfer(stnId, type, info)

        this.fillThemeColour()

        // clear the original stations
        $('#stn_icons').empty()
        this.drawStns()
    }

    // rewrite this to call fillThemeColour when add station
    addStn(prep: 'before' | 'after', stnId: ID, loc, end: ID): [ID, StationInfo] {
        let [newId, newInfo] = super.addStn(prep, stnId, loc, end)
        this.fillThemeColour()
        return [newId, newInfo]
    }

    // rewrite this to change the railmap position
    set yPc(val) {
        super.yPc = val

        let y = val * this._svgHeight / 50;
        $('g#main').attr('transform', `translate(0,${y})`);
    }

}