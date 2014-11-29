require(["jquery", "widget"], function($, Widget) {

    var ItemWidget = Widget.extend({
        attrs: {
            selected: false,
            compressed: true
        },

        events: {
            "click [data-role=select]": "select",
            "click [data-role=compress]": "compress",
            "click [data-role=select-checkbox]": "handler",
            "click [data-role=compress-checkbox]": "handler"
        },

        // 阻止默认的选中，手动来控制
        handler: function(e) {
            // e.preventDefault();
            e.stopPropagation();

            this[$(e.target).attr("data-t")]();
        },

        select: function() {
            var widget = this;
            widget.set("selected", !widget.get("selected"));
        },

        compress: function() {
            var widget = this;

            widget.set("compressed", !widget.get("compressed"));
        },

        setup: function() {
            var widget = this;

            ItemWidget.superclass.setup.call(this);


            widget.$selectCheckbox = widget.$("[data-role=select-checkbox]");
            widget.$compressCheckbox = widget.$("[data-role=compress-checkbox]");
        },

        _onRenderSelected: function(val) {
            this.$selectCheckbox.prop("checked", val).parent()[(val ? "add" : "remove") + "Class"]("active");
        },
        _onRenderCompressed: function(val) {
            this.$compressCheckbox.prop("checked", val);
        }
    });


    var widgets = [];
    $(".js-publish-item").each(function() {
        var widget = new ItemWidget({
            element: this
        }).render();

        widgets.push(widget);
    });

    $("body")
    .on("click", "#js-select-all", function() {
        if (widgets.length === filterWidgets("selected").length) {
            setWidgets("selected", false);
        } else {
            setWidgets("selected", true);
        }
    })
    .on("click", "#js-compress-all", function() {
        if (widgets.length === filterWidgets("compressed").length) {
            setWidgets("compressed", false);
        } else {
            setWidgets("compressed", true);
        }
    })
    .on("click", "#js-submit", function(e) {
        var data = [];

        widgets.forEach(function(widget) {
            if (widget.get("selected")) {
                data.push({
                    name: widget.get("name"),
                    compressed: widget.get("compressed")
                });
            }
        });

        if (data.length) {
            var $btn = $(e.target);
            $btn.hide();

            $.ajax({
                url: "/commit",
                data: {
                    data: JSON.stringify(data)
                },
                type: "post",
                dataType: "json"
            }).done(function(response) {
                var code = response.code,
                    result = response.result;
                if (code === 100) {
                    location.href = result.packagePath;
                } else {
                    console.log(response);
                    alert(response.msg);
                }
            }).always(function() {
                $btn.show();
            });
        }
    });

    function filterWidgets(attr) {
        return widgets.filter(function(widget) {
            return widget.get(attr) == true;
        });
    };

    function setWidgets(attr, val) {
        widgets.forEach(function(widget) {
            widget.set(attr, val);
        });
    };

    window.widgets = widgets;
});