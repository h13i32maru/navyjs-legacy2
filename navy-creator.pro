#-------------------------------------------------
#
# Project created by QtCreator 2013-09-18T10:57:34
#
#-------------------------------------------------

QT       += core gui webkitwidgets

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = "NavyCreator"
TEMPLATE = app


SOURCES += main.cpp\
        main_window.cpp \
    n_code_widget.cpp \
    extend/n_tree_view.cpp \
    util/n_json.cpp \
    util/n_util.cpp \
    n_image_widget.cpp \
    n_layout_widget.cpp \
    native_bridge.cpp \
    n_layout_prop_edit.cpp \
    extend/n_tree_widget.cpp \
    window/n_exec_widget.cpp \
    n_file_widget.cpp \
    n_config_app_widget.cpp \
    n_config_scene_widget.cpp \
    n_config_page_widget.cpp \
    window/n_text_dialog.cpp \
    n_project.cpp \
    extend/n_completer.cpp \
    extend/n_combo_box.cpp

HEADERS  += main_window.h \
    n_code_widget.h \
    extend/n_tree_view.h \
    util/n_json.h \
    util/n_util.h \
    n_image_widget.h \
    n_layout_widget.h \
    native_bridge.h \
    n_layout_prop_edit.h \
    extend/n_tree_widget.h \
    window/n_exec_widget.h \
    n_file_widget.h \
    n_config_app_widget.h \
    n_config_scene_widget.h \
    n_config_page_widget.h \
    window/n_text_dialog.h \
    n_project.h \
    extend/n_completer.h \
    extend/n_combo_box.h

FORMS    += main_window.ui \
    n_code_widget.ui \
    n_image_widget.ui \
    n_layout_widget.ui \
    n_layout_edit_widget.ui \
    n_layout_prop_edit.ui \
    window/n_exec_widget.ui \
    n_config_app_widget.ui \
    n_config_scene_widget.ui \
    n_config_page_widget.ui \
    window/n_text_dialog.ui

RESOURCES += \
    resource.qrc
