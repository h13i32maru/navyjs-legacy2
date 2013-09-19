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
    jobject.cpp \
    edit_json_dialog.cpp

HEADERS  += main_window.h \
    jobject.h \
    edit_json_dialog.h

FORMS    += main_window.ui \
    edit_json_dialog.ui

RESOURCES += \
    resource.qrc
