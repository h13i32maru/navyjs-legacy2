#include "main_window.h"
#include <QApplication>
#include <QGuiApplication>
#include <QScreen>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow w;
    w.resize(QGuiApplication::primaryScreen()->availableSize());
    w.show();

    return a.exec();
}
