(function(b,r,a,n,c,h,_,s,d,k){if(!b[n]||!b[n]._q){for(;s<_.length;)c(h,_[s++]);d=r.createElement(a);d.async=1;d.src="https://cdn.branch.io/branch-latest.min.js";k=r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d,k);b[n]=h}})(window,document,"script","branch",function(b,r){b[r]=function(){b._q.push([r,arguments])}},{_q:[],_v:1},"addListener applyCode banner closeBanner creditHistory credits data deepview deepviewCta first getCode init link logout redeem referrals removeListener sendSMS setIdentity track validateCode".split(" "), 0);
branch.init('key_live_odgIvV706uMda6yzeNq5icppsvekRsG7');


$(document).ready(function() {
    $.App = {};
    $.App.settings = {
        circleId: null,
        duration: null,
        dataPreference: null,
        tab: "u"
    };
    $.App.settings.circleId = $(".select-region select").val();
    $.App.settings.dataPreference = $(".select-connection a.radio-item.select").data('pref');
    $(".select-region select").change(function(){
        $.App.settings.circleId = $(".select-region select").val();
    });
    $(".select-duration a.radio-item").click(function(){
        var elm = $(this);
        if(!elm.hasClass("select")) {
            $(".select-duration a.radio-item").removeClass("select");
            elm.addClass("select");
            $.App.settings.numDays = elm.data("num_days");
        }
        if($.App.settings.numDays) {
            $(".select-connection").removeClass("hide");
            $("a.cta-button").removeClass("hide");
        }
    });
    $(".select-connection a.radio-item").click(function(){
        var elm = $(this);
        if(!elm.hasClass("select")) {
            $(".select-connection a.radio-item").removeClass("select");
            elm.addClass("select");
            $.App.settings.dataPreference = elm.data("pref");
        }
    });
    $("a.cta-button").click(function(){
        window.location.href = "/best-plans/" + $.App.settings.circleId + "/" + getHashUrl($.App.settings);
    });

});

$(document).keyup(function(e) {

});
