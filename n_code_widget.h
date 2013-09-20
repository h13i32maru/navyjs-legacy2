#ifndef N_CODE_WIDGET_H
#define N_CODE_WIDGET_H

#include <QDir>
#include <QFileSystemModel>
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
    QFileSystemModel *mFileSysteMmodel;

    void updateTabForPath(const QString &oldPath, const QString &newPath);
    void deleteTabForPath(const QString &path, const bool &isDir);
    QList<int> searchTabIndexesByPath(const QString &path, const bool &isDir);

public slots:
    void saveCode();

private slots:
    void contextMenu();
    void editCode(QModelIndex index);
    void newFile();
    void deletePath();
    void renamePath();
    void copyPath();
    void newDir();
};

#endif // N_CODE_WIDGET_H
