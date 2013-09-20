#ifndef N_CODE_WIDGET_H
#define N_CODE_WIDGET_H

#include <QDir>
#include <QModelIndex>
#include <QWidget>

namespace Ui {
class NCodeWidget;
}

class NCodeWidget : public QWidget
{
    Q_OBJECT

public:
    explicit NCodeWidget(QWidget *parent = 0);
    void setCurrentProject(QString dirPath);
    ~NCodeWidget();

private:
    Ui::NCodeWidget *ui;
    QDir *mProjectDir;
    QString mProjectName;

public slots:
    void saveCode();

private slots:
    void editCode(QModelIndex index);
};

#endif // N_CODE_WIDGET_H
