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
    n_tree_view.cpp \
    n_json.cpp \
    n_util.cpp \
    n_image_widget.cpp \
    n_layout_widget.cpp \
    native_bridge.cpp \
    n_layout_prop_edit.cpp \
    n_tree_widget.cpp \
    n_exec_widget.cpp \
    n_file_widget.cpp \
    n_config_app_widget.cpp \
    n_config_scene_widget.cpp \
    n_config_page_widget.cpp \
    n_text_dialog.cpp

HEADERS  += main_window.h \
    n_code_widget.h \
    n_tree_view.h \
    n_json.h \
    n_util.h \
    n_image_widget.h \
    n_layout_widget.h \
    native_bridge.h \
    n_layout_prop_edit.h \
    n_tree_widget.h \
    n_exec_widget.h \
    n_file_widget.h \
    n_config_app_widget.h \
    n_config_scene_widget.h \
    n_config_page_widget.h \
    n_text_dialog.h

FORMS    += main_window.ui \
    n_code_widget.ui \
    n_image_widget.ui \
    n_file_tab_editor.ui \
    n_layout_widget.ui \
    n_layout_edit_widget.ui \
    n_layout_prop_edit.ui \
    n_exec_widget.ui \
    n_config_app_widget.ui \
    n_config_scene_widget.ui \
    n_config_page_widget.ui \
    n_text_dialog.ui

RESOURCES += \
    resource.qrc
