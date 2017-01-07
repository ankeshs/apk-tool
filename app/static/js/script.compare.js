/* Begin: Utility methods */
function dataFmtObj(val) {
    if(val < 0.9 * 1024) {
        return {v: Math.round(val), u: "KB"};
    } else if(val < 9.9 * 1024) {
        return {v: Math.round(val / 102.4) / 10.0, u: "MB"};
    } else if(val < 990 * 1024) {
        return {v: Math.round(val / 1024), u: "MB"};
    } else if(val < 9.9 * 1024 * 1024) {
        return {v: Math.round(val / (1024 * 1024 / 10.0)) / 10.0, u: "GB"};
    } else {
        return {v: Math.round(val / (1024 * 1024)), u: "GB"};
    }
    return {v: 0, u: "KB"};
}

function dataFmt(val) {
    fmtObj = dataFmtObj(val);
    return fmtObj.v + " " + fmtObj.u;
}

function dataUnitValue(val, unit) {
    switch(unit) {
        case "KB":
        return Math.round(val);
        case "MB":
        val = val / 1024.0;
        break;
        case "GB":
        val = val / (1024.0 * 1024.0);
        break;
    }
    if(val < 9.9) return Math.round(val * 10.0) / 10.0;
    else return Math.round(val);
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/* End: Utility methods */

/* Begin: Load templates */

$(function() {

    /* Load all underscore templates & fragments into a single object */
    _.templates = {};
    _.fragments = {};

    $.ajax({
        url: _template_url,
        success: function(data) {
            var dataObj = $(data);

            dataObj.filter('script.autoload-tpl').each(function() {
                var elm = $(this);
                _.templates[elm.attr("id")] = _.template(elm.html());
            });

            dataObj.filter('script.autoload-fg').each(function() {
                var elm = $(this);
                _.fragments[elm.attr("id")] = _.template(elm.html());
            });

            $.App = $.App || {};
            $.App.init();
        }
    });

});

/* End: Load templates */

/* Begin: App */
$(function() {
    $.App = $.App || {};
    $.App.Content = $(".phone-display > .app-content");
    $.App.Constants = {
        TAB_RECHARGE: "recharge",
        CALL_DATA_PARITY: 1.0,
        DEFAULT_SELECT: [1, 2, 3, 8, 20]
    };
    $.App.Preference = processHashUrl();
    $.App.Preference.circleId = _circle_id;
    $.App.Preference.tab = "u";
    $.App.serviceProviderIds = [];
    $.App.selectedServiceTypes = [1];
    $.App.selectedProviders = [];
    $.App.updateRoute = function() {
        //history.replaceState(undefined, undefined, getHashUrl($.App.Preference));
        //window.location.hash = getHashUrl($.App.Preference);
    };
    $.App.setSelectedOperators = function() {
        $.App.selectedProviders = [];
        $.App.selectedServiceTypes = [];
        $(document).find(".select-items a.radio-item.select").each(function() {
            $.App.selectedProviders.push(parseInt($(this).data("service_provider_id")));
        });
        $(document).find(".service-type a.radio-item.select").each(function() {
            $.App.selectedServiceTypes.push(parseInt($(this).data("service_type_id")));
        });
    };
    $.App.process = function() {
        var flag = false;
        _.each(["local", "std", "data", "sms"], function(idx) {
            if($.App.OperatorList.customUsage[idx] > 1e-6) flag = true;
        });
        if(flag) $.App.OperatorList.render();
    };
    $.App.setState = function(tab) {
        if($.App.Preference.tab != tab) {
            $("body").removeClass("active-state-" + $.App.Preference.tab);
            var current = $.App.Preference.tab;
            $.App.Preference.tab = tab;
            $("body").addClass("active-state-" + $.App.Preference.tab);
            $.App.updateRoute();
        }
    };

    $.App.init = function() {
        _.each(_operators, function(opr) {
            var id = parseInt(opr.service_provider_id);
            $.App.serviceProviderIds.push(id);
            if($.App.Constants.DEFAULT_SELECT.indexOf(id) >= 0) {
                $.App.selectedProviders.push(id);
            }
        });
        $("a.item-ref-" + $.App.Preference.numDays).addClass("select");
        $("a.item-ref-" + $.App.Preference.dataPreference).addClass("select");
        $("body").addClass("active-state-" + $.App.Preference.tab);
    };

    $.onClick = function(target, callback) { $(document).on("click", target, callback); };
});

$(function() {
    $.onClick(".app-overlays", function() { $.App.View.removeModal(); });
    $.onClick(".select-duration a.radio-item", function() {
        var elm = $(this);
        if(!elm.hasClass("select")) {
            $(".select-duration a.radio-item").removeClass("select");
            elm.addClass("select");
            $.App.Preference.numDays = elm.data("num_days");
            $.App.updateRoute();
            $.App.process();
        }
    });
    $.onClick(".select-connection a.radio-item", function() {
        var elm = $(this);
        if(!elm.hasClass("select")) {
            $(".select-connection a.radio-item").removeClass("select");
            elm.addClass("select");
            $.App.Preference.dataPreference = elm.data("pref");
            $.App.updateRoute();
            $.App.process();
        }
    });
    $.onClick(".operator-select a.radio-item", function() {
        var elm = $(this);
        if(elm.hasClass("postpaid-selector")) { alert("Postpaid support is coming soon!"); return; }
        elm.toggleClass("select");
        $.App.setSelectedOperators();
        $.App.process();
    });
});

/* End: App */

/* Begin: App.Util */

$(function() {
    $.App = $.App || {};
    $.App.Util = {

        addToCacheRegister: function(key) {
            var cacheKeys = localStorage.getItem("jqApp_cache_keys") || "[]";
            cacheKeys = JSON.parse(cacheKeys);
            if(!_.contains(cacheKeys, key)) cacheKeys.push(key);
            localStorage.setItem("jqApp_cache_keys", JSON.stringify(cacheKeys));
        },

        clearAllCache: function() {
            var cacheKeys = localStorage.getItem("jqApp_cache_keys") || "[]";
            cacheKeys = JSON.parse(cacheKeys);
            _.each(cacheKeys, function(key) {
                delete localStorage[key];
            });
            localStorage.setItem("jqApp_cache_keys", "[]");
        },

        getResponseFromCache: function(key) {
            key = "api_cache_" + key;
            try {
                if(!(localStorage.getItem(key))) return {};
                var cacheData = JSON.parse(localStorage.getItem(key));
                if(cacheData.expiry < (new Date()).getTime()) {
                    delete localStorage[key];
                    return {};
                }
                this.addToCacheRegister(key);
                return cacheData.response;
            } catch (e) { return {}; }
        },

        setResponseCache: function(key, duration, responseData) {
            key = "api_cache_" + key;
            this.addToCacheRegister(key);
            localStorage.setItem(key, JSON.stringify({
                expiry: (new Date()).getTime() + duration * 60 * 1000,
                response: responseData
            }));
        },

        usageCopy: function(usage) {
            return {
                local: usage.local,
                std: usage.std,
                data: usage.data,
                sms: usage.sms
            };
        },

        getServiceProviderName: function(id) {
            var result = null;
            _.each(_service_provider_list, function(sp){
                if(sp.service_provider_id == id) result = sp.service_provider_name;
            });
            return result;
        },

        getCircleName: function(id) {
            var result = null;
            _.each(_circle_list, function(cir){
                if(cir.circle_id == id) result = cir.circle_name;
            });
            return result;
        },

        sendEvent: function(catg, action, label) {
            try {
                ga( 'send', 'event', catg, action, label, {useBeacon: true} );
            } catch (e) {}
        }

    };

});

/* End: App.Util */

/* Begin: App.View */

$(function() {
    $.App = $.App || {};

    $.App.View = {

        renderAppContent: function(content) {
            $(".app-content").html(content);
        },

        renderModal: function(content) {
            var overlay = $(document).find(".app-overlays");
            if(overlay.length == 0) {
                $(".app-content").append('<div class="app-overlays" />');
                overlay = $(document).find(".app-overlays");
            }
            overlay.html(content);
        },

        removeModal: function() {
            $(document).find(".app-overlays").remove();
        },

        setItemSelect: function(elm, state) {
            if(state) {
                elm.addClass("selected");
                elm.find("input[type='checkbox']").attr('checked', 'checked');
            } else {
                elm.removeClass("selected");
                elm.find("input[type='checkbox']").attr('checked', false);
            }
        },

    };

});

/* End: App.View */

/* Begin: App.ComboRecommendation */

$(function() {
    $.App = $.App || {};
    $.App.ComboRecommendation = {

        setScrollPosition: function() {
            var top = $(".phone-frame").offset().top;
            //console.log(top);
            if($(window).scrollTop() > top) $(window).scrollTop(top);
        },

        animateComboGraph: function(scale, context) {
            var $f = selector => $(document).find(selector),
            elm = {
                local: {
                    actual: $(document).find(".local-usage.bar-actual-usage"),
                    recommend: $(document).find(".local-usage.bar-recommend-usage")
                },
                std: {
                    actual: $(document).find(".std-usage.bar-actual-usage"),
                    recommend: $(document).find(".std-usage.bar-recommend-usage")
                },
                data: {
                    actual: $(document).find(".data-usage.bar-actual-usage"),
                    recommend: $(document).find(".data-usage.bar-recommend-usage")
                },
                sms: {
                    actual: $(document).find(".sms-usage.bar-actual-usage"),
                    recommend: $(document).find(".sms-usage.bar-recommend-usage")
                }
            }, setValue = function(element, val, dataVal) {
                element.find("div.val").html("" + val);
                if(dataVal) element.data("val", "" + dataVal);
            };

            setValue(elm.local.actual, context.usage.local);
            setValue(elm.std.actual, context.usage.std);
            setValue(elm.data.actual, dataUnitValue(context.usage.data * 1024 * 1024, context.usageData.u), context.usage.data * 1024 * $.App.Constants.CALL_DATA_PARITY);
            setValue(elm.sms.actual, context.usage.sms);

            if(context.index == -1) {
                setValue(elm.local.recommend, 0);
                setValue(elm.std.recommend, 0);
                setValue(elm.data.recommend, 0, 0.01);
                setValue(elm.sms.recommend, 0);
            } else {
                setValue(elm.local.recommend, context.combo.subsets[context.index].equivalentUsage.local);
                setValue(elm.std.recommend, context.combo.subsets[context.index].equivalentUsage.std);
                if(context.combo.subsets[context.index].equivalentUsage.data > 1e-6)
                    setValue(elm.data.recommend, dataUnitValue(context.combo.subsets[context.index].equivalentUsage.data * 1024 * 1024, context.usageData.u), context.combo.subsets[context.index].equivalentUsage.data * 1024 * $.App.Constants.CALL_DATA_PARITY);
                else
                    setValue(elm.data.recommend, dataUnitValue(context.combo.subsets[context.index].equivalentUsage.data * 1024 * 1024, context.usageData.u), 0.01);
                setValue(elm.sms.recommend, context.combo.subsets[context.index].equivalentUsage.sms);
            }

            $(document).find(".combo-usage-graph .bar-graph > div").each(function(){
                var elm = $(this), val = parseFloat(elm.text());
                if(elm.data("val")) val = parseFloat(elm.data("val"));
                elm.animate({height: Math.round(20 + val / scale * 100)}, "slow");
            });
        },

        serviceProviderId: 1,

        serviceProviderLogo: null,

        customUsage: { local: 100, data: 0.5, std: 55, sms: 400 },

        planGuid: null,

        planIds: [],

        requestData: function() {
            var obj = this;
            return {
                dataPreference: $.App.Preference.dataPreference,
                numDays: $.App.Preference.numDays,
                targetUsage: obj.customUsage,
                planIds: obj.planIds
            };
        },

        render: function() {
            var obj = this;
            $.App.activeView = obj;
            var setPlanIdStr = function(subsets) { _.map(subsets, function(subset) {
                    subset.plans.sort();
                    subset.planIdStr = _.reduce(subset.plans, (a, b) => a + "-" + b, "");
                });
            };
            $.App.View.renderAppContent(_.templates.tplRecharge({loading: true}));
            $.App.setState('c');
            obj.setScrollPosition();
            $.ajax({
                url: _api_base + "recommend/compare/detail",
                method: "post",
                data: JSON.stringify(obj.requestData()),
                dataType: "json",
                contentType: 'application/json',
                success: function(response){
                    window.context = {};
                    context.usage = response.body.usage;
                    context.combo = response.body.combos[0];
                    setPlanIdStr(context.combo.subsets);
                    context.index = 0;
                    var planIdsList = _.pluck(context.combo.plans, "planId");
                    planIdsList.sort();
                    var indexFullStr = _.reduce(planIdsList, (a, b) => a + "-" + b, "");
                    console.log(indexFullStr);
                    for(var i in context.combo.subsets) {
                        if(context.combo.subsets[i].planIdStr == indexFullStr) {
                            context.index = i;
                            context.indexFull = i;
                        }
                    }
                    context.usageData = dataFmtObj(context.combo.subsets[context.indexFull].equivalentUsage.data * 1024 * 1024);
                    context.loading = false;
                    $.App.View.renderAppContent(_.templates.tplRecharge(context));
                    $.App.Content.removeClass('busy');
                    var scale = _.max([ 1,
                        context.usage.local,
                        context.combo.subsets[context.indexFull].equivalentUsage.local,
                        context.usage.std,
                        context.combo.subsets[context.indexFull].equivalentUsage.std,
                        context.usage.sms,
                        context.combo.subsets[context.indexFull].equivalentUsage.sms,
                        context.usage.data * $.App.Constants.CALL_DATA_PARITY * 1024,
                        context.combo.subsets[context.indexFull].equivalentUsage.data * $.App.Constants.CALL_DATA_PARITY * 1024
                    ]);
                    obj.animateComboGraph(scale, context);
                    $.App.Preference.comboScreen = {
                        context: context,
                        scale: scale,
                        updatePlanSelection: function(selectionIds) {
                            selectionIds.sort();
                            var selectionStr = _.reduce(selectionIds, (a, b) => a + "-" + b, "");
                            context.index = -1;
                            for(var i in context.combo.subsets) {
                                if(context.combo.subsets[i].planIdStr == selectionStr) {
                                    context.index = i;
                                }
                            }
                            obj.animateComboGraph(scale, context);
                        }
                    };
                    $.App.Util.sendEvent("API Call", "Detail API", "Success");
                },
                beforeSend: function() {

                },
                complete: function() {

                },
                error: function() {
                    $.App.View.renderAppContent(_.templates.tplRecharge({loading: false, failure: true}));
                    $.App.Util.sendEvent("API Call", "Detail API", "Error");
                }
            });
        },

        reset: function() {
            $.App.View.renderAppContent("");
            $(document).find("a.operator-list-item.selected").removeClass("selected");
            $.App.setState('l');
        }

    };
});

$(function() {
    $.onClick("a.app-recharge", function() {
        $.App.Preference.view.tab = $.App.Constants.TAB_RECHARGE;
        if($(this).hasClass("active")) return;
        $.App.render();
    });

    $.onClick("a.combo-duration-btn", function() {
        $.App.View.renderModal(_.fragments.fragmentComboDurationSelect());
    });

    $.onClick(".recommended-plans li a", function() {
        var elm = $(this).parents("li.top-item"),
            btn = elm.parents(".recommended-plans").find("button");
        if(elm.hasClass("selected")) {
            $.App.View.setItemSelect(elm, false);
            btn.removeClass("active");
        } else {
            elm.parents("ul").find("li.selected").each(function(){
                $.App.View.setItemSelect($(this), false);
            });
            $.App.View.setItemSelect(elm, true);
            btn.addClass("active");
        }
    });

    $.onClick(".combo-set-plans li a", function() {
        var elm = $(this).parents("li.top-item"),
            btn = elm.parents(".combo-set-plans").find("button");
        elm.toggleClass("selected");
        var selectionIds = [];
        $(document).find(".combo-set-plans li.selected").each(function() {
            selectionIds.push($(this).data("plan_id"));
        });
        if(selectionIds.length == 0) {
            btn.removeClass("active");
        } else {
            btn.addClass("active");
        }
        $.App.Preference.comboScreen.updatePlanSelection(selectionIds);
    });

    $.onClick("a.app-lhs-item", function() {
        $.App.ComboRecommendation.reset();
    });

    $.onClick(".your-usage a.your-usage-cta", function() {
        $.App.setState('u');
    });

    $.onClick(".cta-action button", function() {
        window.open("http://bit.ly/2e5-recharge", "_blank");
        $.App.Util.sendEvent("Compare", "Combo", "Send");
    });
});

/* End: App.ComboRecommendation */

/* Begin: App.RefineCombo */

$(function() {
    $.App = $.App || {};
    $.App.RefineCombo = {

        originalUsage: {},

        customUsage: {},

        isOriginal: true,

        scaleMaxValues: {
            local: 5000,
            std: 5000,
            data: 10000,
            sms: 5000,
        },

        getScaled: function(value, idx) {
            //return Math.log(value + 1) / Math.log(10001) * 100;
            return Math.pow(value, 1/2) / Math.pow(this.scaleMaxValues[idx], 1/2) * 100;
        },

        fromScaled: function(value, idx) {
            //return Math.exp(value / 100 * Math.log(10001)) - 1;
            return Math.pow(value / 100 * Math.pow(this.scaleMaxValues[idx], 1/2), 2);
        },

        sliders: function() {
            return {
                local: $(document).find(".usage-range.local-usage input"),
                std: $(document).find(".usage-range.std-usage input"),
                data: $(document).find(".usage-range.data-usage input"),
                sms: $(document).find(".usage-range.sms-usage input"),
            };
        },

        ctaBtn: function() {
            return $(document).find(".custom-usage .set-usage-btn");
        },

        scaleFader: function() {
            return {
                cont: $(document).find(".custom-usage .scale-fader"),
                scale: $(document).find(".scale-value span"),
            };
        },

        setMarkerValue: function(elem, value, idx) {
            elem.parents(".usage-range").find(".value span").text("" + Math.round(value));
            if(value > 1e-6) {
                elem.parents(".usage-range").find(".value").addClass("positive");
            } else {
                elem.parents(".usage-range").find(".value").removeClass("positive");
            }
        },

        setValue: function(elem, value, idx) {
            this.setMarkerValue(elem, value, idx);
            elem.val(this.getScaled(value, idx));
        },

        showChange: function() {

        },

        scaleValueByOriginal: function() {
            var obj = this, totalCalls = obj.originalUsage.local + obj.originalUsage.std;
            if(obj.originalUsage.local > 1e-6) obj.scaleMaxValues.local = Math.min(Math.max(totalCalls * 4, 1000), 10000);
            if(obj.originalUsage.std > 1e-6) obj.scaleMaxValues.std = Math.min(Math.max(totalCalls * 4, 1000), 10000);
            if(obj.originalUsage.sms > 1e-6) obj.scaleMaxValues.sms = Math.min(Math.max(obj.originalUsage.sms * 5, 1000), 10000);
        },

        applySliders: function() {
            var obj = this, elems = obj.sliders();
            obj.setSliderValues();

            _.each(["local", "std", "data", "sms"], function(idx){
                elems[idx].on("input change" ,function() {
                    var elm = $(this), value = obj.fromScaled(elm.val(), idx), fader = obj.scaleFader();
                    obj.setMarkerValue(elm, value, idx);
                    if(idx == "data") {
                        obj.customUsage.data = value / 1024.0;
                    } else {
                        obj.customUsage[idx] = Math.round(value);
                    }
                    obj.onChange();
                });

                elems[idx].parents(".usage-range").find(".value").click(
                    function() {
                        var elm = $(this).find('span');
                        elm.attr('contentEditable', true);
                        elm.focus();
                    }
                );
                elems[idx].parents(".usage-range").find(".value > span").blur(
                    function() {
                        var elm = $(this);
                        var value = 0;
                        try {
                            value = parseInt(elm.text());
                            if(value == NaN) value = 0;
                        } catch(e) { }
                        if(value > obj.scaleMaxValues[idx]) value = obj.scaleMaxValues[idx];
                        if(idx == "data") {
                            obj.customUsage[idx] = value / 1024.0;
                        } else {
                            obj.customUsage[idx] = value;
                        }
                        elm.attr('contentEditable', false);
                        obj.setSliderValues();
                    }
                );
            });
        },

        resetUsage: function() {
            this.customUsage = $.App.Util.usageCopy(this.originalUsage);
            this.setSliderValues();
            this.isOriginal = true;
            this.resetBtn().removeClass("active");
        },

        onChange: function() {
            var flag = false, obj = this;
            _.each(["local", "std", "data", "sms"], function(idx) {
                if(obj.customUsage[idx] > 1e-6) flag = true;
            });
            if(flag) obj.ctaBtn().addClass('active');
            else obj.ctaBtn().removeClass('active');
        },

        setSliderValues: function() {
            var elems = this.sliders();
            this.setValue(elems.local, this.customUsage.local, "local");
            this.setValue(elems.std, this.customUsage.std, "std");
            this.setValue(elems.data, this.customUsage.data * 1024, "data");
            this.setValue(elems.sms, this.customUsage.sms, "sms");
            this.onChange();
        },

        render: function() {
            var obj = this;
            _.each(["local", "std", "data", "sms"], function(idx) {
                obj.customUsage[idx] = 0;
            });
            this.applySliders();
        },

        process: function() {
            var obj = this;
            $.App.OperatorList.customUsage = $.App.Util.usageCopy(obj.customUsage);
            $.App.OperatorList.render();
            $.App.Util.sendEvent("Compare", "Plans", "Request");
        }

    };
});

$(function() {
    $.onClick("a.set-usage-btn.active", function() {
        $.App.RefineCombo.process();
    });
});

/* End: App.RefineCombo */

/* Begin: App.OperatorList */

$(function() {
    $.App = $.App || {};
    $.App.OperatorList = {

        customUsage: { },

        requestData: function(){
            var obj = this;
            return {
                serviceTypeIds: $.App.selectedServiceTypes,
                serviceProviderIds: $.App.serviceProviderIds,
                circleId: $.App.Preference.circleId,
                dataPreference: $.App.Preference.dataPreference,
                targetUsage: obj.customUsage,
                numDays: $.App.Preference.numDays
            };
        },

        cont: $(".operator-list"),

        contextData: { },

        currentCacheKey: "",

        cachedData: { },

        render: function() {
            var obj = this;
            obj.contextData = {};
            $.App.ComboRecommendation.reset();

            var	onSuccess = function(response) {
                    context = JSON.parse(JSON.stringify(response.body));
                    context.planList = _.filter(context.planList, function(p) {
                        return $.App.selectedProviders.indexOf(p.metadata.serviceProviderId) >= 0;
                    });
                    obj.cont.html(_.templates.tplOperatorList(context));
                    _.each(context.planList, function(plan) {
                        obj.contextData[plan.metadata.guid] = plan;
                    });
                    if(context.planList.length > 0)
                        $(".phone-frame .empty-state").addClass("shown");
                    else
                        $(".phone-frame .empty-state").removeClass("shown");
                    $.App.Util.sendEvent("API Call", "Comapare API", "Success");
                },
                onError = function() {
                    obj.cont.html(_.fragments.fragmentOperatorListEmpty());
                    $(".phone-frame .empty-state").removeClass("shown");
                    $.App.Util.sendEvent("API Call", "Comapare API", "Error");
                },
                dataKey = JSON.stringify(obj.requestData()).hashCode(),
                loadingHtml = function() {
                    return _.fragments.fragmentOperatorListLoading() +
                        _.fragments.fragmentOperatorListLoading() +
                        "<p class='loading-text'>Looking up over 1, 000, 000 plan combinations</p>" ;
                };

            if(dataKey == obj.currentCacheKey) {
                try {
                    obj.cont.html(loadingHtml());
                    setTimeout(function() {
                        onSuccess(obj.cachedData);
                    }, 300);
                } catch(e) { onError(); }
                return;
            }

            $.ajax({
              url:  _api_base + "recommend/compare",
              method: "post",
              data: JSON.stringify(obj.requestData()),
              dataType: "json",
              contentType: "application/json",
              success: function(response){
                  onSuccess(response);
                  obj.currentCacheKey = dataKey;
                  obj.cachedData = response;
              },
              beforeSend: function() {
                obj.cont.html(loadingHtml());
              },
              complete: function() {

              },
              error: onError
          });
        },

        process: function(elm) {
            var obj = this,
                guid = elm.data("guid"),
                operatorPlan = obj.contextData[guid];
            $.App.ComboRecommendation.customUsage = obj.customUsage;
            $.App.ComboRecommendation.planIds = operatorPlan.metadata.planIds;
            $.App.ComboRecommendation.serviceProviderLogo = operatorPlan.metadata.serviceProviderLogo;
            $.App.ComboRecommendation.render();
        }

    };
});

$(function() {
    $.onClick("a.operator-list-item", function() {
        if($(this).hasClass("selected")) return;
        $(document).find(".operator-list-item.selected").removeClass("selected");
        $(this).addClass("selected");
        $.App.OperatorList.process($(this));
        $.App.Util.sendEvent("Compare", "Plan", "Details");
    });
});

/* End: App.OperatorList */
