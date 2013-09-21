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
    njson.cpp \
    nutil.cpp \
    n_config_widget.cpp \
    n_code_widget.cpp \
    n_tree_view.cpp

HEADERS  += main_window.h \
    edit_json_dialog.h \
    njson.h \
    nutil.h \
    n_config_widget.h \
    n_code_widget.h \
    n_tree_view.h

FORMS    += main_window.ui \
    edit_json_dialog.ui \
    n_config_widget.ui \
    n_code_widget.ui

RESOURCES += \
    resource.qrc
