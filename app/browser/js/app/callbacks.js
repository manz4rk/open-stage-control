var init = require('./init'),
    actions = require('./actions'),
    utils = require('./utils'),
    icon = utils.icon

module.exports = {

    receiveOsc: function(event,data){
        var data = data || event

        // fetch ids corresponding to the osc path
        var path = data.path,
            pathref = path,
            args = data.args,
            target = data.target

        if (typeof data.args == 'object') {
            for (var i=data.args.length-1;i>=0;i--) {
                var ref = path+'||||'+data.args.slice(0,i).join('||||')
                if (WIDGETS_BY_PATH[ref]) {
                    pathref = ref
                    args = data.args.slice(i,data.args.length)
                    continue
                }
            }
        } else {
            args = data.args
        }


        if (args.length==0) args = null
        else if (args.length==1) args = args[0]

        for (i in WIDGETS_BY_PATH[pathref]) {
            // if the message target is provided (when message comes from another client connected to the same server)
            // then we only update the widgets that have the same target
            // compare arrays using > and < operators (both false = equality)
            if (!target || !(WIDGETS_BY_PATH[pathref][i].target < target || WIDGETS_BY_PATH[pathref][i].target > target)) {
                // update matching widgets
                if (WIDGETS_BY_PATH[pathref][i]) WIDGETS_BY_PATH[pathref][i].setValue(args,{send:false,sync:true,fromExternal:!target})
            }
        }


    },

    connected:function(){
        LOADING.close()
    },

    stateLoad: function(event,data){
        var data = data || event
        data = JSON.parse(data)
        actions.stateSet(data,true)
        actions.stateQuickSave(data)
    },

    sessionList: function(event,data){
        var data = data || event
        $('#lobby').append(`
            <div class="main">
                <div class="header">
                    Open Stage Control
                </div>
                <div class="list"></div>
                <div class="footer"></div>
            </div>`)

        for (i in data) {
            $('#lobby .list').append('<a class="btn load" data-session="'+data[i]+'">'+data[i]+'<span>'+icon('remove')+'</span></a>')
        }
        $('#lobby .footer').append('<a class="btn browse">'+icon('folder-open')+' Browse</a>')
        $('#lobby .footer').append('<a class="btn new">'+icon('file-o')+' New</a>')
        $('#lobby .load').click(function(e){
            e.stopPropagation()
            IPC.send('sessionOpen',{path:$(this).data('session')})
        })
        $('#lobby a span').click(function(e){
            e.stopPropagation()
            IPC.send('sessionRemoveFromHistory',$(this).parent().data('session'))
            $(this).parents('a').remove()
        })
        $('#lobby .browse').click(function(e){
            e.stopPropagation()
            actions.sessionBrowse()
        })
        $('#lobby .new').click(function(e){
            e.stopPropagation()
            init([{}],function(){$('#open-toggle, .enable-editor').click();$('.editor-root').trigger('mousedown.editor')})
        })
    },

    sessionOpen: function(event,data){
        var data = data || event
        var session = JSON.parse(data)
        init(session,function(){
            IPC.send('sessionOpened')
        })

    },

    stateSend:function(){
        var p = utils.loading('New client connecting...')

        setTimeout(function(){

            OSCSYNCONLY = true
            actions.stateSend()
            OSCSYNCONLY = false

            p.close()
        },150)
    },

    error: function(event,data){
        var data = data || event

        utils.createPopup(icon('warning')+'&nbsp;'+data.title,data.text)
    },

    applyStyle: function(event,data){
        var data = data || event
        var style = document.createElement('style');
        style.innerHTML = data.join('');
        document.body.appendChild(style);
        if (data.indexOf('--pixel-scale')!=-1) {
            PXSCALE = data.match(/--pixel-scale\s*:\s*([^;]*)/)[1]
            INITIALZOOM = PXSCALE
        }
    }

}
