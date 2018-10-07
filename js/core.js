var fs = require('fs');

const {basename} = require('path')
const {dirname} = require('path')
const path = require('path');
const settings = require('electron-settings')

var makeLowercase = true;
var replaceSpaces = true;
var darkmode = false;

Dropzone.autoDiscover = false;

var checkForExistingFile = function(pathToFile){
    if (fs.existsSync(pathToFile)) { 
        return true;
    }
    else{
        return false;
    }
}

var checkSettings = function(){
    //console.log("checking settings");
    //console.log(settings.getAll());

    // LOWERCASE SETTINGS
    if(settings.has('lowercaseSettings.lowercase')){
        if(settings.get('lowercaseSettings.lowercase')){
            $("#to_lowercase").addClass("active");
            $("#to_lowercase").text("a");
            makeLowercase = true;
        }
        else{
            $("#to_lowercase").removeClass("active");
            $("#to_lowercase").text("A");
            makeLowercase = false;
        }
    }
    else{
        //default
        $("#to_lowercase").addClass("active");
        $("#to_lowercase").text("a");
        makeLowercase = true;
    }

    // SPACE SETTINGS => <-- that's a rocket :P
    if(settings.has('spaceSettings.nospaces')){
        if(settings.get('spaceSettings.nospaces')){
            $("#replace_spaces").addClass("active");
            replaceSpaces = true;
        }
        else{
            $("#replace_spaces").removeClass("active");
            replaceSpaces = false;
        }
    }
    else{
        $("#replace_spaces").addClass("active");
        replaceSpaces = true;
    }

    // DARKMODE SETTINGS
    if(settings.has('darkmode.dark')){
        if(settings.get('darkmode.dark')){
            $("#toggle_darkmode").addClass("darkmode");
            $("body").addClass("dark");
            darkmode = true;
        }
        else{
            $("#toggle_darkmode").removeClass("darkmode");
            $("body").removeClass("dark");
            darkmode = false;
        }
    }
    else{
        //default
        $("#toggle_darkmode").removeClass("darkmode");
        $("body").removeClass("dark");
        darkmode = true;
    }

    
}

var setSettingsToDefault = function(){
    //console.log("default settings activated");
    settings.delete('lowercaseSettings.lowercase');
    settings.delete('spaceSettings.nospaces');
    settings.delete('darkmode.dark');

    //settings.deleteAll();

    makeLowercase = true;
    replaceSpaces = true;
    darkmode = false;

    checkSettings();
}


$(document).ready(function(){

    //console.log(settings.getAll());

    if(!settings.has('disclaimer.read')){
        $("#dim").fadeIn("fast")
    }

    checkSettings();

    $("#to_lowercase").click(function(){
        $(this).toggleClass("active");

        if($(this).hasClass("active")){
            $(this).text("a");
            $(this).prop('title', "Don't make filename lowercase");

            settings.set('lowercaseSettings', {
                lowercase: true
            });
        }
        else{
            $(this).text("A");
            $(this).prop('title', 'Make filename lowercase');

            settings.set('lowercaseSettings', {
                lowercase: false
            });
        }

        checkSettings();
    });

    $("#replace_spaces").click(function(){
        $(this).toggleClass("active");

        if($(this).hasClass("active")){
            $(this).prop('title', "Don't replace all spaces");

            settings.set('spaceSettings', {
                nospaces: true
            });
        }
        else{
            $(this).prop('title', "Replace all spaces");

            settings.set('spaceSettings', {
                nospaces: false
            });
        }

        checkSettings();
    });

    $("#toggle_darkmode").click(function(){
        $("body").toggleClass("dark");
        $(this).toggleClass("darkmode");

        if($("body").hasClass("dark")){
            $(this).prop('title', "Turn on light theme");

            settings.set('darkmode', {
                dark: true
            });
        }
        else{
            $(this).prop('title', "Turn on darkmode");

            settings.set('darkmode', {
                dark: false
            });
        }

        checkSettings();
    })

    $("#default_settings").click(function(){
        setSettingsToDefault();
    })

    $("#read_disclaimer").click(function(){
        $("#dim").fadeOut("fast");

        settings.set('disclaimer', {
            read: true
        });
    })


    var dropZone = $("div#renameDropzone").dropzone({ 
        url: "bash/renamer.sh",
        dictDefaultMessage: "Drop your files here to rename them<br><small>(or click here)</small>",
        accept: function(file, done) {


            return done();
        },
        complete: function(file){
            let i = 0; // Incrementor for existing file names
            let fileHasIncrementor = false;

            // OLD FILE INFO
            var filePath = file.path;
            var fileDir = dirname(filePath);
            var fileName_Ext = basename(filePath);
            var fileName = path.parse(fileName_Ext).name;
            var fileExtension = path.parse(fileName_Ext).ext; // never ever touch this part

            //console.log(filePath);

            if(fs.lstatSync(filePath).isDirectory()){
                console.log("its a directory");

            }
            else{
                // NEW FILE INFO
                /** All the operations to make the name fancy START **/
                var newFileName = fileName;
                //console.log(newFileName);

                if(makeLowercase){
                    newFileName = fileName.toLowerCase();
                }
                
                newFileName = $.trim(newFileName);

                if(replaceSpaces){
                    newFileName = newFileName.replace(/\ /g, "_")
                }
                
                newFileName = newFileName.replace(/[!$%^&*()+|~=`{}\[\]:";'<>?,.\/]/g, "-");

                newFileName = newFileName.replace(/[^\x00-\x7F]/g, ""); // remove all non ASCII letters
                /** All the operations to make the name fancy END **/

                if(newFileName == ""){
                    newFileName = "new_filename"
                }

                var newFullPath = fileDir+"/"+newFileName+fileExtension;
                //console.log("file ext: " + fileExtension);

                // File name already exists
                while(checkForExistingFile(newFullPath) && filePath != newFullPath){
                    //console.log(i)
                    i++;

                    if(!fileHasIncrementor){
                        newFileName = newFileName + "-" + i;
                        newFullPath = fileDir + "/" + newFileName + fileExtension;
                        fileHasIncrementor = true;
                    }
                    else{
                        let fileSplitter = newFileName.split("-");
                        let incrementnumber = fileSplitter[fileSplitter.length-1];
                        incrementnumber++;
                        delete fileSplitter[fileSplitter.length-1];

                        newFullPath = fileDir + "/" + fileSplitter.join("-") + incrementnumber + fileExtension;
                    }
                }

                // Filename doesn't exist
                if(!checkForExistingFile(newFullPath)){
                    fs.rename(filePath, newFullPath, function(err) {
                        if ( err ) console.log('ERROR: ' + err);
                    });
                }
            }
            
            this.removeAllFiles();
        }
    });
});