/*
 * SonarQube
 * Copyright (C) 2009-2016 SonarSource SA
 * mailto:contact AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import React from 'react';
import keyBy from 'lodash/keyBy';
import ProfileRulesRow from './ProfileRulesRow';
import { ProfileType } from '../propTypes';
import { searchRules, takeFacet } from '../../../api/rules';
import { translate, translateWithParameters } from '../../../helpers/l10n';
import { formatMeasure } from '../../../helpers/measures';
import {
    getRulesUrl,
    getDeprecatedActiveRulesUrl
} from '../../../helpers/urls';

const TYPES = ['BUG', 'VULNERABILITY', 'CODE_SMELL'];

export default class ProfileRules extends React.Component {
  static propTypes = {
    profile: ProfileType.isRequired,
    canAdmin: React.PropTypes.bool.isRequired
  };

  state = {
    total: null,
    activatedTotal: null,
    allByType: keyBy(TYPES.map(t => ({ val: t, count: null })), 'val'),
    activatedByType: keyBy(TYPES.map(t => ({ val: t, count: null })), 'val')
  };

  componentDidMount () {
    this.mounted = true;
    this.loadRules();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.profile !== this.props.profile) {
      this.loadRules();
    }
  }

  componentWillUnmount () {
    this.mounted = false;
  }

  loadAllRules () {
    return searchRules({
      languages: this.props.profile.language,
      ps: 1,
      facets: 'types'
    });
  }

  loadActivatedRules () {
    return searchRules({
      qprofile: this.props.profile.key,
      activation: 'true',
      ps: 1,
      facets: 'types'
    });
  }

  loadRules () {
    Promise.all([
      this.loadAllRules(),
      this.loadActivatedRules()
    ]).then(responses => {
      if (this.mounted) {
        const [allRules, activatedRules] = responses;
        this.setState({
          total: allRules.total,
          activatedTotal: activatedRules.total,
          allByType: keyBy(takeFacet(allRules, 'types'), 'val'),
          activatedByType: keyBy(takeFacet(activatedRules, 'types'), 'val')
        });
      }
    });
  }

  getTooltip (count, total) {
    if (count == null || total == null) {
      return '';
    }

    return translateWithParameters(
        'quality_profiles.x_activated_out_of_y',
        formatMeasure(count, 'INT'),
        formatMeasure(total, 'INT'));
  }

  renderActiveTitle () {
    return (
        <strong>
          {translate('total')}
        </strong>
    );
  }

  renderActiveCount () {
    const rulesUrl = getRulesUrl({
      qprofile: this.props.profile.key,
      activation: 'true'
    });

    if (this.state.activatedTotal == null) {
      return null;
    }

    return (
        <a href={rulesUrl}>
          <strong>
            {formatMeasure(this.state.activatedTotal, 'SHORT_INT')}
          </strong>
        </a>
    );
  }

  renderActiveTotal () {
    const rulesUrl = getRulesUrl({
      qprofile: this.props.profile.key,
      activation: 'false'
    });

    if (this.state.total == null) {
      return null;
    }

    if (this.state.total === this.state.activatedTotal) {
      return <span className="note text-muted">0</span>;
    }

    return (
        <a href={rulesUrl} className="small text-muted">
          <strong>
            {formatMeasure(
                this.state.total - this.state.activatedTotal,
                'SHORT_INT'
            )}
          </strong>
        </a>
    );
  }

  getTooltipForType (type) {
    const { count } = this.state.activatedByType[type];
    const total = this.state.allByType[type].count;
    return this.getTooltip(count, total);
  }

  renderTitleForType (type) {
    return <span>{translate('issue.type', type, 'plural')}</span>;
  }

  renderCountForType (type) {
    const rulesUrl = getRulesUrl({
      qprofile: this.props.profile.key,
      activation: 'true',
      types: type
    });

    const { count } = this.state.activatedByType[type];

    if (count == null) {
      return null;
    }

    return (
        <a href={rulesUrl}>
          {formatMeasure(count, 'SHORT_INT')}
        </a>
    );
  }

  renderTotalForType (type) {
    const rulesUrl = getRulesUrl({
      qprofile: this.props.profile.key,
      activation: 'false',
      types: type
    });

    const { count } = this.state.activatedByType[type];
    const { count: total } = this.state.allByType[type];

    if (count == null) {
      return null;
    }

    if (total === count) {
      return <span className="note text-muted">0</span>;
    }

    return (
        <a href={rulesUrl} className="small text-muted">
          {formatMeasure(total - count, 'SHORT_INT')}
        </a>
    );
  }

  renderDeprecated () {
    const { profile } = this.props;

    if (profile.activeDeprecatedRuleCount === 0) {
      return null;
    }

    const url = getDeprecatedActiveRulesUrl({ qprofile: profile.key });

    return (
        <div className="quality-profile-rules-deprecated clearfix">
          <div className="pull-left">
            {translate('quality_profiles.deprecated_rules')}
          </div>
          <div className="pull-right">
            <a href={url}>
              {profile.activeDeprecatedRuleCount}
            </a>
          </div>
        </div>
    );
  }

  render () {
    const activateMoreUrl = getRulesUrl({
      qprofile: this.props.profile.key,
      activation: 'false'
    });

    return (
        <div className="quality-profile-rules">
          <div className="quality-profile-rules-distribution">
            <table className="data condensed">
              <thead>
                <tr>
                  <th>
                    <h2>{translate('rules')}</h2>
                  </th>
                  <th>Active</th>
                  <th>Inactive</th>
                </tr>
              </thead>
              <tbody>
                <ProfileRulesRow
                    key="all"
                    renderTitle={this.renderActiveTitle.bind(this)}
                    renderCount={this.renderActiveCount.bind(this)}
                    renderTotal={this.renderActiveTotal.bind(this)}/>
                {TYPES.map(type => (
                    <ProfileRulesRow
                        key={type}
                        renderTitle={this.renderTitleForType.bind(this, type)}
                        renderCount={this.renderCountForType.bind(this, type)}
                        renderTotal={this.renderTotalForType.bind(this, type)}/>
                ))}
              </tbody>
            </table>

            {this.props.canAdmin && (
                <div className="text-right big-spacer-top">
                  <a href={activateMoreUrl}
                     className="button js-activate-rules">
                    {translate('quality_profiles.activate_more')}
                  </a>
                </div>
            )}
          </div>

          {this.renderDeprecated()}
        </div>
    );
  }
}
