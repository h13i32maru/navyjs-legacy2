#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

#include "n_exec_widget.h"

#include <QMainWindow>
#include <QDir>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();

private:
    Ui::MainWindow *ui;
    QString mProjectName;
    QDir *mProjectDir;
    NExecWidget *mExecWidget;

    void setCurrentProject(QString dirPath);

private slots:
    void openProject();
    void newProject();
    void saveAll();
    void execNavy();
};

#endif // MAIN_WINDOW_H
