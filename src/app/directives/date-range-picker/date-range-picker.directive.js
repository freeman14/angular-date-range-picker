export function DateRangePicker() {
  'ngInject';

  let directive = {
    restrict: 'E',
    scope: {
      weekStart: '&',
      range: '=?',
      static: '=?',
      minDay: '&',
      maxDay: '&',
      api: '&',
      monthFormat: '&',
      inputFormat: '&',
      weekDaysName: '&',
      linkedCalendars: '&',
      interceptors: '&',
      turn: '&'
    },
    templateUrl: 'app/directives/date-range-picker/date-range-picker.html',
    controller: DateRangePickerController,
    controllerAs: 'picker',
    bindToController: true
  };

  return directive;
}

class DateRangePickerController {

  constructor(moment, $scope) {
    'ngInject';

    this.Moment = moment;
    this.Scope = $scope;

    this.range = this.range || {};
    this.static = this.static || {};
    this.setConfigurations();
    this.startCalendarApi = {};
    this.endCalendarApi = {};
    this.setInterceptors();
    this.setListeners();
    this.setApi();
    this.watchRangeChange();
    this.interceptors = this.interceptors() || {}

    this.minRangeDay = undefined;
    this.maxRangeDay = undefined;

    this.hovered = undefined;

  }

  setApi() {
    let api = this.api() || {};
    Object.assign(api, {
      setCalendarPosition: (start, end) => {
        this.startCalendar = start;
        if (this.linkedCalendars() || start.isSame(end, 'M')) {
          this.endCalendar = this.startCalendar.clone();
          this.startCalendar = this.startCalendar.subtract(1, 'M')
        } else {
          this.endCalendar = end;
        }

      },
      render: () => {
        this.startCalendarApi.render();
        this.endCalendarApi.render();
      }
    });
  }

  setListeners() {
    this.Scope.$watchGroup([() => {
      return this.range.start;
    }, () => {
      return this.range.end;
    }], (newRange) => {
      if (newRange[0] && newRange[1]) {
        this.setConfigurations();
      }
    });
  }

  setConfigurations() {
    let start, end;
    if (this.isMomentRange(this.range)) {
      start = this.range.start;
      end = this.range.end;
    } else {
      start = this.Moment(this.range.start, this.getFormat());
      end = this.Moment(this.range.end, this.getFormat());
    }

    end = end.diff(start) >= 0 ? end : start.clone();
    this.rangeStart = start;
    this.rangeEnd = end;
    this.daysSelected = 2;
    this.updateRange();
  }

  updateRange() {
    if (this.isMomentRange(this.range)) {
      this.range.start = this.rangeStart;
      this.range.end = this.rangeEnd;
    } else {
      this.range.start = this.rangeStart ? this.rangeStart.format(this.getFormat()) : null;
      this.range.end = this.rangeEnd ? this.rangeEnd.format(this.getFormat()) : null;
    }
  }

  setInterceptors() {
    this.startCalendarInterceptors = {
      moveToPrevClicked: () => {
        this.moveCalenders(-1, 'start');
      },
      moveToNextClicked: () => {
        this.moveCalenders(1, 'start')
      },
      daySelected: (day) => {
        this.dayInStartSelected(day);
        this.daySelected(day);

        if (this.daysSelected == 2) {
          // this.interceptors.rangeSelectedByClick && this.interceptors.rangeSelectedByClick();
          this.interceptors.secondDaySelected && this.interceptors.secondDaySelected({
            start: this.rangeStart,
            end: this.rangeEnd
          });
          this.minRangeDay = undefined;
          this.maxRangeDay = undefined;
        } else {
          this.interceptors.firstDaySelected && this.interceptors.firstDaySelected({
            start: this.rangeStart,
            end: this.rangeEnd
          });
          if (angular.isDefined(day.mo)) {
            this.minRangeDay = day.mo.clone();
            this.maxRangeDay = day.mo.clone().add(29, 'days');
          } else {
            this.minRangeDay = day.clone();
            this.maxRangeDay = day.clone().add(29, 'days');
          }
        }

      },
      inputSelected: (day) => {
        this.inputInStartSelected(day);
      },
      dayHovered: (day, mouseover) => {
        this.onHover(day, mouseover);
      }
    };

    this.endCalendarInterceptors = {
      moveToPrevClicked: () => {
        this.moveCalenders(-1, 'end');
      },
      moveToNextClicked: () => {
        this.moveCalenders(1, 'end')
      },
      daySelected: (day) => {
        this.dayInEndSelected(day);
        this.daySelected(day);

        if (this.daysSelected == 2) {
          // this.interceptors.rangeSelectedByClick && this.interceptors.rangeSelectedByClick();
          this.interceptors.secondDaySelected && this.interceptors.secondDaySelected({
            start: this.rangeStart,
            end: this.rangeEnd
          });
          this.minRangeDay = undefined;
          this.maxRangeDay = undefined;
        } else {
          this.interceptors.firstDaySelected && this.interceptors.firstDaySelected({
            start: this.rangeStart,
            end: this.rangeEnd
          });
          // if (angular.isDefined(day.mo)) {
          //   this.minRangeDay = day.mo.clone();
          //   this.maxRangeDay = day.mo.clone().add(29, 'days');
          // } else {
          //   this.minRangeDay = day.clone();
          //   this.maxRangeDay = day.clone().add(29, 'days');
          // }
        }

      },
      inputSelected: (day) => {
        this.inputInEndSelected(day);
      },
      dayHovered: (day, mouseover) => {
        this.onHover(day, mouseover);
      }
    }
  }

  inputInStartSelected(day) {
    switch (this.daysSelected) {
      case 0:
      case 1:
        this.rangeStart = day;
        this.daysSelected = 1;
        break;
      case 2:
        if (day.diff(this.rangeStart, 'days') < 0) {
          this.rangeStart = day;
        } else if (day.isBetween(this.rangeStart, this.rangeEnd)) {
          this.rangeStart = day;
        } else if (day.diff(this.rangeEnd, 'days') >= 0) {
          this.rangeStart = day;
          this.rangeEnd = day;
        }
        this.daysSelected = 2;
        this.updateRange();
        break;
    }
  }

  inputInEndSelected(day) {
    switch (this.daysSelected) {
      case 0:
        this.rangeStart = day;
        this.daysSelected = 1;
        break;
      case 1:
      case 2:
        if (day.diff(this.rangeStart, 'days') <= 0) {
          this.rangeStart = day;
          this.rangeEnd = day;
        } else if (day.isSame(this.startCalendar, 'months') || day.isSame(this.endCalendar, 'months')) {
          this.rangeEnd = day;
        } else if (!day.isSame(this.endCalendar, 'months')) {
          this.rangeEnd = day;
        }

        this.daysSelected = 2;
        this.updateRange();
        break;
    }
  }

  dayInStartSelected(day) {
    let nextMonth = this.startCalendar.clone().add(1, 'M');

    if (day.isSame(nextMonth, 'month')) {
      this.dayInEndSelected(day);
    }
  }

  dayInEndSelected(day) {
    let prevMonth = this.endCalendar.clone().subtract(1, 'M');

    if (day.isSame(prevMonth, 'month')) {
      this.dayInStartSelected(day);
    }
  }

  daySelected(day) {
    let turn = this.turn();

    if (turn === 'first') {

      if (day.diff(this.rangeEnd, 'days') < -29) {
        this.rangeEnd = day.clone();
      }

      this.rangeStart = day;
      this.daysSelected = 1;

    } else if (turn === 'second') {

      // If second day is before current first day, then update first day instead and promt to update second day
      if (day.diff(this.rangeStart, 'days') < 0) {
        this.rangeEnd = day.clone();
        this.rangeStart = day;
        this.daysSelected = 1;
      } else {
        this.rangeEnd = day;
        this.daysSelected = 2;
      }

    }

    this.updateRange();

  }

  onHover(day, mouseover) {
    if (mouseover) {
      if (angular.isDefined(day.mo)) {
        this.dayHovered = day.mo.clone();
      } else {
        this.dayHovered = day.clone();
      }
    } else {
      this.dayHovered = undefined;
    }
  }

  moveCalenders(month, calendar) {
    if (this.areCalendarsLinked()) {
      this.startCalendar = this.startCalendar.clone().add(month, 'M');
      this.endCalendar = this.endCalendar.clone().add(month, 'M');
    } else {
      if (calendar === 'start') {
        this.startCalendar = this.startCalendar.clone().add(month, 'M');
      } else {
        this.endCalendar = this.endCalendar.clone().add(month, 'M');
      }
    }
  }

  isMomentRange(range) {
    let isRange = false;
    if (range && range.start && range.end) {
      isRange = this.Moment.isMoment(this.range.start) && this.Moment.isMoment(this.range.end)
    }

    return isRange;
  }

  watchRangeChange() {
    this.Scope.$watchGroup([() => {
      return this.rangeStart;
    }, () => {
      return this.rangeEnd;
    }], (newRange, oldRange) => {
      let newStart = newRange[0];
      let newEnd = newRange[1];
      if (typeof this.maxDay() !== 'undefined' &&
            typeof newStart !== 'undefined' &&
            newStart.format('MM-YYYY') === this.maxDay().format('MM-YYYY')) {
          this.startCalendar = newStart.clone().subtract(1, 'M');
          this.endCalendar = newStart;
          return;
        }

      if (!this.startCalendar && !this.endCalendar) {
        if (newStart.date() < 15 && newEnd.date() < 21 && newStart.isSame(newEnd, 'M')) {
          this.startCalendar = newStart.clone().subtract(1, 'M');
          this.endCalendar = newStart;
        } else {
          this.startCalendar = newStart;
          this.endCalendar = newStart.clone().add(1, 'M');
        }
      } else {
        this.startCalendar = newStart;
        this.endCalendar = newStart.clone().add(1, 'M');
      }

    });
  }

  areCalendarsLinked() {
    return angular.isDefined(this.linkedCalendars()) ? this.linkedCalendars() : true;
  }
}
