#-------------------------------------------------
#
# Project created by QtCreator 2013-09-18T10:57:34
#
#-------------------------------------------------

QT       += core gui webkitwidgets

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = "Navy Creator"
TEMPLATE = app


SOURCES += main.cpp\
        main_window.cpp \
    edit_json_dialog.cpp \
    n_config_widget.cpp \
    n_code_widget.cpp \
    n_tree_view.cpp \
    n_json.cpp \
    n_util.cpp \
    n_image_widget.cpp \
    n_file_tab_editor.cpp \
    n_layout_widget.cpp \
    native_bridge.cpp \
    n_layout_edit_widget.cpp \
    n_layout_prop_edit.cpp

HEADERS  += main_window.h \
    edit_json_dialog.h \
    n_config_widget.h \
    n_code_widget.h \
    n_tree_view.h \
    n_json.h \
    n_util.h \
    n_image_widget.h \
    n_file_tab_editor.h \
    n_layout_widget.h \
    native_bridge.h \
    n_layout_edit_widget.h \
    n_layout_prop_edit.h

FORMS    += main_window.ui \
    edit_json_dialog.ui \
    n_config_widget.ui \
    n_code_widget.ui \
    n_image_widget.ui \
    n_file_tab_editor.ui \
    n_layout_widget.ui \
    n_layout_edit_widget.ui \
    n_layout_prop_edit.ui

RESOURCES += \
    resource.qrc
