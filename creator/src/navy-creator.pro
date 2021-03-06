#-------------------------------------------------
#
# Project created by QtCreator 2013-09-18T10:57:34
#
#-------------------------------------------------

QT       += core gui webkitwidgets

CONFIG += c++11

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = "NavyCreator"
TEMPLATE = app

# 現在QtCreatorではinfo.plistが作られないバグが有る。
# 通常はICONを設定すれば良いだけだが、QMAKE_INFO_PLISTも設定しないとアイコンが設定されない
# http://qt-project.org/doc/qt-5/appicon.html#setting-the-application-icon-on-mac-os-x
# http://qt-project.org/forums/viewthread/24811/
ICON = resource/nc.icns
QMAKE_INFO_PLIST = resource/info.plist

SOURCES += main.cpp\
        main_window.cpp \
    n_code_widget.cpp \
    extend/n_tree_view.cpp \
    util/n_json.cpp \
    util/n_util.cpp \
    n_image_widget.cpp \
    n_layout_widget.cpp \
    native_bridge.cpp \
    extend/n_tree_widget.cpp \
    window/n_exec_widget.cpp \
    n_file_widget.cpp \
    n_config_app_widget.cpp \
    n_config_scene_widget.cpp \
    n_config_page_widget.cpp \
    window/n_text_dialog.cpp \
    n_project.cpp \
    extend/n_completer.cpp \
    extend/n_combo_box.cpp \
    window/n_scene_dialog.cpp \
    window/n_page_dialog.cpp \
    window/n_file_opener.cpp \
    window/n_build_error_dialog.cpp \
    window/n_pref_dialog.cpp \
    window/n_new_project_dialog.cpp \
    window/n_project_dialog.cpp \
    window/n_layout_setting_dialog.cpp \
    plugin/view_plugin.cpp \
    window/n_list_dialog.cpp \
    extend/n_text_list_selector.cpp \
    n_manifest_widget.cpp \
    window/n_layout_json_table.cpp \
    extend/n_json_array_editor.cpp \
    extend/n_table_widget.cpp \
    window/n_built_in_image_importer.cpp \
    window/n_about_dialog.cpp

HEADERS  += main_window.h \
    n_code_widget.h \
    extend/n_tree_view.h \
    util/n_json.h \
    util/n_util.h \
    n_image_widget.h \
    n_layout_widget.h \
    native_bridge.h \
    extend/n_tree_widget.h \
    window/n_exec_widget.h \
    n_file_widget.h \
    n_config_app_widget.h \
    n_config_scene_widget.h \
    n_config_page_widget.h \
    window/n_text_dialog.h \
    n_project.h \
    extend/n_completer.h \
    extend/n_combo_box.h \
    window/n_scene_dialog.h \
    window/n_page_dialog.h \
    window/n_file_opener.h \
    window/n_build_error_dialog.h \
    window/n_pref_dialog.h \
    window/n_new_project_dialog.h \
    window/n_project_dialog.h \
    window/n_layout_setting_dialog.h \
    plugin/view_plugin.h \
    window/n_list_dialog.h \
    extend/n_text_list_selector.h \
    n_manifest_widget.h \
    window/n_layout_json_table.h \
    extend/n_json_array_editor.h \
    extend/n_table_widget.h \
    window/n_built_in_image_importer.h \
    window/n_about_dialog.h

FORMS    += main_window.ui \
    n_code_widget.ui \
    n_image_widget.ui \
    n_layout_widget.ui \
    window/n_exec_widget.ui \
    n_config_app_widget.ui \
    n_config_scene_widget.ui \
    n_config_page_widget.ui \
    window/n_text_dialog.ui \
    window/n_scene_dialog.ui \
    window/n_page_dialog.ui \
    window/n_file_opener.ui \
    window/n_build_error_dialog.ui \
    window/n_pref_dialog.ui \
    window/n_new_project_dialog.ui \
    window/n_project_dialog.ui \
    window/n_layout_setting_dialog.ui \
    window/n_list_dialog.ui \
    n_manifest_widget.ui \
    window/n_layout_json_table.ui \
    window/n_built_in_image_importer.ui \
    window/n_about_dialog.ui

RESOURCES += \
    resource/template.qrc\
    resource/template_code.qrc\
    resource/sample.qrc \
    resource/built_in_image.qrc \
    resource/misc.qrc
