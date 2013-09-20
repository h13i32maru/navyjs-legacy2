#ifndef MAIN_WINDOW_H
#define MAIN_WINDOW_H

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

    void setCurrentProject(QString dirPath);

private slots:
    void openProject();
    void newProject();
    void saveAll();
};

#endif // MAIN_WINDOW_H
